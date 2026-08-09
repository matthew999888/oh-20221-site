/* =====================================================================
   Cloudflare Turnstile — server-side verification
   ---------------------------------------------------------------------
   Turnstile is a privacy-preserving CAPTCHA alternative. The browser
   widget produces a single-use token; this module redeems that token
   against Cloudflare's siteverify API.

   Setup:
     NEXT_PUBLIC_TURNSTILE_SITE_KEY   widget key (safe to expose)
     TURNSTILE_SECRET_KEY             server secret (never expose)

   Get both from Cloudflare dashboard -> Turnstile -> Add site. Add every
   hostname you serve from, including localhost for development.

   Cloudflare also publishes always-pass / always-fail testing keys:
     site 1x00000000000000000000AA / secret 1x0000000000000000000000000000000AA  (always passes)
     site 2x00000000000000000000AB / secret 2x0000000000000000000000000000000AA  (always blocks)

   IMPORTANT: a token is valid ONCE and expires after ~5 minutes. Never
   verify the same token twice — the second attempt legitimately fails.
===================================================================== */

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const turnstileConfigured = Boolean(
  process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
);

export type TurnstileResult = { success: true } | { success: false; reason: string };

/** Maps Cloudflare's error codes to something a cadet can act on. */
function describe(codes: string[]): string {
  if (codes.includes("missing-input-response")) {
    return "Please complete the human verification check.";
  }
  if (codes.includes("timeout-or-duplicate")) {
    return "That verification expired. Please try again.";
  }
  if (codes.includes("invalid-input-response")) {
    return "Human verification failed. Please try again.";
  }
  if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
    // A configuration fault, not a user fault — don't blame the user.
    console.error("[turnstile] TURNSTILE_SECRET_KEY is missing or invalid.");
    return "Verification is misconfigured. Please contact an instructor.";
  }
  return "Human verification failed. Please try again.";
}

/**
 * Verify a Turnstile token.
 *
 * @param token    value of the `cf-turnstile-response` form field
 * @param remoteIp client IP, optional but recommended — Cloudflare uses
 *                 it as an additional signal
 *
 * If Turnstile is not configured, this returns success so local
 * development and first-run deploys are not blocked by a missing key.
 * A warning is logged in production so a misconfiguration is visible
 * rather than silently leaving the forms unprotected.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileResult> {
  if (!turnstileConfigured) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY are not set. " +
          "Bot verification is DISABLED on the sign-in and sign-up forms."
      );
    }
    return { success: true };
  }

  if (!token) {
    return { success: false, reason: describe(["missing-input-response"]) };
  }

  const body = new FormData();
  body.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  body.append("response", token);
  if (remoteIp && remoteIp !== "unknown") body.append("remoteip", remoteIp);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (data.success) return { success: true };
    return { success: false, reason: describe(data["error-codes"] ?? []) };
  } catch (err) {
    // Network failure reaching Cloudflare. Fail CLOSED here — unlike rate
    // limiting, this guards the credential endpoint, and briefly refusing
    // sign-ins is preferable to dropping bot protection entirely.
    console.error("[turnstile] siteverify request failed:", err);
    return { success: false, reason: "Could not complete verification. Please try again." };
  }
}

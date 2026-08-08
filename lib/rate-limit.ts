/* =====================================================================
   Rate limiting — Upstash Redis sliding window
   ---------------------------------------------------------------------
   Why a shared store: this app runs on serverless/edge isolates, which
   do not share memory between invocations. An in-process Map would give
   each isolate its own counter and be trivially bypassed by spreading
   requests. Upstash is a network store every isolate can reach.

   Setup (both required, or limiting is disabled — see FAIL-OPEN below):
     UPSTASH_REDIS_REST_URL
     UPSTASH_REDIS_REST_TOKEN

   FAIL-OPEN policy
   ----------------
   If the env vars are missing, or Upstash is unreachable, requests are
   ALLOWED rather than blocked, and a warning is logged. Rationale: a
   Redis outage should not lock every cadet out of the portal. The
   trade-off is that limiting silently stops protecting during an
   outage, so `ratelimitConfigured` is exported for the health endpoint
   to surface. Do not "improve" this to fail-closed without deciding
   who is on call for Upstash.
===================================================================== */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const ratelimitConfigured = Boolean(url && token);

if (!ratelimitConfigured && process.env.NODE_ENV === "production") {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. " +
      "Rate limiting is DISABLED. Set both before serving production traffic."
  );
}

const redis = ratelimitConfigured ? new Redis({ url: url!, token: token! }) : null;

/**
 * Policy tiers. Windows are deliberately generous for normal use and
 * tight for the endpoints an attacker actually targets.
 *
 * `analytics: false` keeps this inside the Upstash free tier — enabling
 * it writes an extra sorted-set entry per request.
 */
const POLICIES = {
  /** Sign-in attempts. Tight: this is the credential-stuffing surface. */
  auth: { limit: 5, window: "15 m" },
  /** Account requests. Tighter still — each one creates a DB row. */
  signup: { limit: 3, window: "1 h" },
  /** Authenticated writes: server actions that mutate data. */
  mutation: { limit: 30, window: "1 m" },
  /** Expensive writes: PDF generation, bulk operations, test grading. */
  expensive: { limit: 10, window: "1 m" },
  /** Public JSON endpoints. */
  api: { limit: 60, window: "1 m" },
  /** Whole-site backstop applied in middleware. */
  global: { limit: 300, window: "1 m" }
} as const;

export type PolicyName = keyof typeof POLICIES;

// Limiters are created lazily and cached: constructing one per request
// would leak connections and re-parse config on every invocation.
const limiters = new Map<PolicyName, Ratelimit>();

function getLimiter(policy: PolicyName): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(policy);
  if (!limiter) {
    const { limit, window } = POLICIES[policy];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${policy}`,
      analytics: false
    });
    limiters.set(policy, limiter);
  }
  return limiter;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the window resets. */
  reset: number;
  /** Seconds the caller should wait — for the Retry-After header. */
  retryAfterSeconds: number;
};

const ALLOWED: RateLimitResult = {
  success: true,
  limit: 0,
  remaining: 0,
  reset: 0,
  retryAfterSeconds: 0
};

/**
 * Check a request against a policy.
 *
 * @param policy     which tier to apply
 * @param identifier stable per-caller key — a user id when signed in,
 *                   otherwise the client IP. Callers should namespace
 *                   it (e.g. `user:abc`, `ip:1.2.3.4`) so a user id can
 *                   never collide with an IP.
 */
export async function checkRateLimit(
  policy: PolicyName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(policy);
  if (!limiter) return ALLOWED;

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return {
      success,
      limit,
      remaining,
      reset,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    };
  } catch (err) {
    // Fail open — see the note at the top of this file.
    console.error(`[rate-limit] Upstash unreachable for policy "${policy}":`, err);
    return ALLOWED;
  }
}

/**
 * Best-effort client IP.
 *
 * Order matters. `cf-connecting-ip` is set by Cloudflare and cannot be
 * spoofed by the client once traffic goes through Cloudflare, so it is
 * checked first. `x-forwarded-for` is only trustworthy behind a proxy
 * that overwrites it; we take the FIRST entry, which is the original
 * client, and accept that a direct-to-origin request could forge it.
 * Lock the origin to your proxy in production so that cannot happen.
 */
export function getClientIp(headers: Headers): string {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const real = headers.get("x-real-ip");
  if (real) return real.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  // No IP available (local dev, or a misconfigured proxy). Returning a
  // constant means every such caller shares one bucket — safe, because
  // it errs toward limiting more, not less.
  return "unknown";
}

/** Standard rate-limit response headers (draft IETF `RateLimit-*`). */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil((result.reset - Date.now()) / 1000)),
    "Retry-After": String(result.retryAfterSeconds)
  };
}

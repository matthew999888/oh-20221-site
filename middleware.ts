import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit, getClientIp, rateLimitHeaders } from "@/lib/rate-limit";

// Routes that never require auth.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/announcements",
  "/calendar",
  "/gallery",
  "/dept",
  "/ldr",
  "/roster",
  // Legal pages must stay reachable without an account — a privacy
  // policy behind a login is not notice.
  "/privacy",
  "/terms",
  "/accessibility",
  // Health check. Must be reachable anonymously or uptime monitoring
  // just measures the login redirect. The route itself only returns
  // `{ok:true}` to anonymous callers — counts and configuration state
  // are gated to admins inside the handler.
  "/api/health"
];
// Prefixes that never require auth (covers dynamic sub-routes, e.g. /gallery/[id], /dept/[slug], /ldr/[slug]).
const PUBLIC_PATH_PREFIXES = ["/gallery/", "/dept/", "/ldr/"];

// Routes that an unapproved/roleless user IS allowed to hit even though
// they're "logged in but not fully onboarded" — avoids redirect loops and
// lets them sign out.
const ALWAYS_ALLOWED_AUTHENTICATED_PATHS = ["/waiting-approval"];

/**
 * Security headers applied to every response.
 *
 * No Content-Security-Policy is set here on purpose: the app currently
 * loads styles and scripts from three external origins (Google Fonts,
 * the Font Awesome CDN, and Cloudflare Turnstile) and Next injects
 * inline bootstrap scripts. A CSP added without nonce plumbing would
 * either break the site or be so permissive it adds nothing. See the
 * README section "Adding a Content-Security-Policy" for the real fix.
 */
const SECURITY_HEADERS: Record<string, string> = {
  // Stop MIME-sniffing a response into something executable.
  "X-Content-Type-Options": "nosniff",
  // Legacy clickjacking guard; `frame-ancestors` supersedes it in a CSP.
  "X-Frame-Options": "DENY",
  // Don't leak the full URL (which can contain ids) to other origins.
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // This app needs none of these; deny them rather than inherit defaults.
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Force HTTPS for two years. Safe here because the site is HTTPS-only.
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains"
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  // static assets, Next internals, and the NextAuth API routes are excluded
  // via the matcher below, so nothing else needs to be listed here.
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Whole-site backstop, applied before auth so unauthenticated floods
  // are cheap to reject. Per-endpoint limits (auth, signup, mutation)
  // are enforced closer to the work in lib/rate-limit.ts consumers —
  // this only catches broad hammering.
  const ip = getClientIp(req.headers);
  const limit = await checkRateLimit("global", `ip:${ip}`);
  if (!limit.success) {
    return withSecurityHeaders(
      new NextResponse("Too many requests. Please slow down and try again shortly.", {
        status: 429,
        headers: { "Content-Type": "text/plain", ...rateLimitHeaders(limit) }
      }) as NextResponse
    );
  }

  if (isPublicPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in -> sign-in, preserving where they were headed.
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return withSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (ALWAYS_ALLOWED_AUTHENTICATED_PATHS.includes(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const status = token.status as "pending" | "approved" | undefined;
  const roles = (token.roles as string[] | undefined) ?? [];

  const isPending = status === "pending";
  const isApprovedButRoleless = status === "approved" && roles.length === 0;

  if (isPending || isApprovedButRoleless) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/waiting-approval", req.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  // Run on everything except: Next internals, static files, and the
  // NextAuth API routes themselves (those must stay reachable to sign in).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)"]
};

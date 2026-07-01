import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that never require auth.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/announcements", "/calendar", "/gallery", "/dept", "/ldr", "/roster"];
// Prefixes that never require auth (covers dynamic sub-routes, e.g. /gallery/[id], /dept/[slug], /ldr/[slug]).
const PUBLIC_PATH_PREFIXES = ["/gallery/", "/dept/", "/ldr/"];

// Routes that an unapproved/roleless user IS allowed to hit even though
// they're "logged in but not fully onboarded" — avoids redirect loops and
// lets them sign out.
const ALWAYS_ALLOWED_AUTHENTICATED_PATHS = ["/waiting-approval"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  // static assets, Next internals, and the NextAuth API routes are excluded
  // via the matcher below, so nothing else needs to be listed here.
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in -> sign-in, preserving where they were headed.
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (ALWAYS_ALLOWED_AUTHENTICATED_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const status = token.status as "pending" | "approved" | undefined;
  const roles = (token.roles as string[] | undefined) ?? [];

  const isPending = status === "pending";
  const isApprovedButRoleless = status === "approved" && roles.length === 0;

  if (isPending || isApprovedButRoleless) {
    return NextResponse.redirect(new URL("/waiting-approval", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except: Next internals, static files, and the
  // NextAuth API routes themselves (those must stay reachable to sign in).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\..*).*)"]
};

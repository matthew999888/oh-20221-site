import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  ratelimitConfigured
} from "@/lib/rate-limit";
import { turnstileConfigured } from "@/lib/turnstile";

// Never cache a health check — a cached "ok" from ten minutes ago is
// worse than no health check at all.
export const dynamic = "force-dynamic";

export async function GET() {
  // Next 15: headers() is async.
  const requestHeaders = await headers();
  const limit = await checkRateLimit("api", `ip:${getClientIp(requestHeaders)}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  // Row counts and configuration state are operational details, so they
  // are only returned to a signed-in admin. Anonymous callers get a bare
  // liveness answer.
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.roles?.includes("admin") ?? false;

  try {
    // Cheap query that proves the connection and the schema are live
    // without scanning a table.
    await prisma.$queryRaw`SELECT 1`;

    if (!isAdmin) {
      return NextResponse.json({ ok: true });
    }

    const [roleCount, userCount] = await Promise.all([
      prisma.role.count(),
      prisma.user.count()
    ]);

    return NextResponse.json({
      ok: true,
      database: "connected",
      roleCount,
      userCount,
      // Surfaces the fail-open protections so a misconfigured deploy is
      // visible instead of silently unprotected.
      rateLimiting: ratelimitConfigured ? "enabled" : "DISABLED",
      turnstile: turnstileConfigured ? "enabled" : "DISABLED"
    });
  } catch (err) {
    // The raw Prisma error can contain the database host, port, and
    // user, so it goes to the server log, never to the response.
    console.error("[health] database check failed:", err);
    return NextResponse.json(
      { ok: false, error: isAdmin ? (err as Error).message : "database_unavailable" },
      { status: 503 }
    );
  }
}

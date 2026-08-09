/* =====================================================================
   Server-only permission enforcement
   ---------------------------------------------------------------------
   Split out of lib/permissions.ts so that the pure helpers there
   (canView, canEdit, getPagePermission, ...) stay importable from
   Client Components.

   Everything below reaches getServerSession -> lib/auth -> lib/prisma,
   and on Cloudflare Workers lib/prisma pulls in @prisma/adapter-pg and
   the `pg` driver. Re-merging these files would drag a Postgres client
   into the browser bundle and fail the build.

   Import from here in Server Components, route handlers, and Server
   Actions only.
===================================================================== */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, type PolicyName } from "@/lib/rate-limit";
import {
  canEditDepartment,
  canEditLdr,
  getPagePermission,
  levelMeetsRequirement,
  type PageKey,
  type PermissionLevel
} from "@/lib/permissions";

export class PermissionError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super(
      `Too many requests. Please wait ${retryAfterSeconds} second${
        retryAfterSeconds === 1 ? "" : "s"
      } and try again.`
    );
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Rate-limit gate for Server Actions.
 *
 * Every mutating action in this app funnels through one of the assert*
 * helpers below, so enforcing here covers all of them at once — there is
 * no need (and no reliable way) to remember to add a check to each new
 * action file.
 *
 * Keyed by user id, not IP. Cadets on the same school Wi-Fi share one
 * public IP, so an IP-keyed limit would let a single busy cadet lock out
 * an entire class. Every caller below has already been authenticated, so
 * a user id is always available — which also means this module never
 * needs `next/headers`, and so stays importable from the client
 * components that use the pure permission helpers above.
 */
async function assertNotRateLimited(userId: string, policy: PolicyName = "mutation") {
  const result = await checkRateLimit(policy, `user:${userId}`);
  if (!result.success) {
    throw new RateLimitError(result.retryAfterSeconds);
  }
}

/**
 * Wrap an expensive action (PDF generation, bulk writes, test grading)
 * to apply the tighter `expensive` policy on top of the normal check.
 */
export async function assertExpensiveActionAllowed(userId: string) {
  await assertNotRateLimited(userId, "expensive");
}

/**
 * For use at the top of a Server Component (page.tsx / layout.tsx).
 * Redirects to /login or /waiting-approval as appropriate, then redirects
 * to /dashboard if the user lacks the required permission level on the
 * given page. Returns the session on success, for convenience.
 */
export async function requirePagePermission(page: PageKey, required: PermissionLevel = "view") {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/")}`);
  }

  if (session.user.status === "pending" || (session.user.status === "approved" && session.user.roles.length === 0)) {
    redirect("/waiting-approval");
  }

  const level = getPagePermission(session.user.roles, page);
  if (!levelMeetsRequirement(level, required)) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * For use inside a Server Action (mutations). Throws PermissionError
 * instead of redirecting, since actions should surface an error to the
 * calling form/UI rather than navigate away mid-submission.
 */
export async function assertPagePermission(page: PageKey, required: PermissionLevel = "edit") {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new PermissionError("You must be signed in to do that.");
  }

  if (session.user.status === "pending" || (session.user.status === "approved" && session.user.roles.length === 0)) {
    throw new PermissionError("Your account is not yet fully approved.");
  }

  const level = getPagePermission(session.user.roles, page);
  if (!levelMeetsRequirement(level, required)) {
    throw new PermissionError();
  }

  await assertNotRateLimited(session.user.id);
  return session;
}

/**
 * For use inside dept/[slug] and ldr/[slug] Server Actions. Throws
 * PermissionError unless the signed-in user holds that exact
 * department/LDR role (or is an admin).
 */
export async function assertDepartmentEdit(deptSlug: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new PermissionError("You must be signed in to do that.");
  }
  if (session.user.status === "pending" || session.user.roles.length === 0) {
    throw new PermissionError("Your account is not yet fully approved.");
  }
  if (!canEditDepartment(session.user.roles, deptSlug)) {
    throw new PermissionError("Only this department's officer (or an admin) can edit this page.");
  }

  await assertNotRateLimited(session.user.id);
  return session;
}

export async function assertLdrEdit(ldrSlug: string) {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new PermissionError("You must be signed in to do that.");
  }
  if (session.user.status === "pending" || session.user.roles.length === 0) {
    throw new PermissionError("Your account is not yet fully approved.");
  }
  if (!canEditLdr(session.user.roles, ldrSlug)) {
    throw new PermissionError("Only this team's lead (or an admin) can edit this page.");
  }

  await assertNotRateLimited(session.user.id);
  return session;
}

/**
 * For use by anything that just needs "signed in + approved", e.g.
 * casting a reaction vote — any approved member can react, not just the
 * page's editor.
 */
export async function requireApprovedSession() {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new PermissionError("You must be signed in to do that.");
  }
  if (session.user.status === "pending" || session.user.roles.length === 0) {
    throw new PermissionError("Your account is not yet fully approved.");
  }

  await assertNotRateLimited(session.user.id);
  return session;
}

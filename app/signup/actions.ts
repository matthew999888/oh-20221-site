"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { logActivity } from "@/lib/activity-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80, "That name is too long."),
  email: z
    .string()
    .trim()
    .max(160, "That email address is too long.")
    .email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    // bcrypt silently truncates past 72 bytes; capping well under that
    // avoids surprises and blocks absurdly large inputs.
    .max(72, "Password must be 72 characters or fewer."),
  // COPPA: we do not knowingly collect personal information from
  // children under 13, so account requests require an explicit
  // attestation rather than an inferred age.
  ageConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 13 or older." })
  })
});

/**
 * First-admin bootstrap.
 *
 * Normally every account is created `pending` with no roles, and an
 * existing admin approves it. That is a chicken-and-egg problem on a
 * fresh database: with zero admins, nobody can approve anybody.
 *
 * This grants admin automatically to an address listed in
 * BOOTSTRAP_ADMIN_EMAILS — but ONLY while the unit has no admin yet.
 *
 * Why that second condition matters: this app does not verify email
 * addresses, so "this address gets admin" otherwise means "whoever
 * registers this address first gets admin." Gating on zero-admins
 * shrinks that to a single, one-time window that closes permanently the
 * moment the first admin exists. After that this function always
 * returns false and the env var is inert.
 *
 * The address lives in an env var rather than in source because this
 * repository is public — a hardcoded address would tell an attacker
 * exactly which account to race for.
 *
 * Safest option of all: skip this and seed the admin directly with
 * `npm run seed` (see README), which never exposes a signup path.
 */
async function shouldBootstrapAsAdmin(email: string): Promise<boolean> {
  const allowed = (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length === 0 || !allowed.includes(email)) return false;

  // The window is open only until the first admin exists.
  const existingAdmin = await prisma.user.findFirst({
    where: { roles: { some: { role: { slug: "admin" } } } },
    select: { id: true }
  });

  return existingAdmin === null;
}

export type SignUpState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password" | "ageConfirmed", string>>;
};

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  // Next 15: headers() is async.
  const ip = getClientIp(await headers());

  // Rate limit BEFORE any database work or Turnstile round-trip, so a
  // flood costs us as little as possible.
  const limit = await checkRateLimit("signup", `ip:${ip}`);
  if (!limit.success) {
    return {
      ok: false,
      message: `Too many account requests from this network. Please try again in ${Math.ceil(
        limit.retryAfterSeconds / 60
      )} minute(s).`
    };
  }

  const turnstile = await verifyTurnstile(
    formData.get("cf-turnstile-response")?.toString(),
    ip
  );
  if (!turnstile.success) {
    return { ok: false, message: turnstile.reason };
  }

  const parsed = signUpSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    ageConfirmed: formData.get("ageConfirmed") === "on"
  });

  if (!parsed.success) {
    const fieldErrors: SignUpState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<SignUpState["fieldErrors"]>;
      fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    return {
      ok: false,
      message: "An account with that email already exists.",
      fieldErrors: { email: "Already registered." }
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const bootstrapAdmin = await shouldBootstrapAsAdmin(email);

  if (bootstrapAdmin) {
    const adminRole = await prisma.role.findUnique({
      where: { slug: "admin" },
      select: { id: true }
    });

    if (adminRole) {
      const user = await prisma.user.create({
        data: {
          name: parsed.data.name,
          email,
          passwordHash,
          status: "approved",
          roles: { create: { roleId: adminRole.id } }
        }
      });

      // Deliberately audited: this is the one path that grants privilege
      // without another admin approving it.
      await logActivity(user.id, "user.bootstrapped-as-admin", "User", user.id, { email });

      return {
        ok: true,
        message:
          "Administrator account created. You can sign in now — you have full access."
      };
    }

    // Roles table not seeded yet. Fall through to the normal pending
    // path rather than silently creating a roleless "approved" account.
    console.error(
      "[signup] BOOTSTRAP_ADMIN_EMAIL matched but no 'admin' role exists. " +
        "Run `npm run seed` first."
    );
  }

  // Pending status, no roles assigned — matches Role "Unassigned" default
  // conceptually, but we deliberately do NOT attach any UserRole row here,
  // so the user has zero roles until an admin assigns one.
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash,
      status: "pending"
    }
  });

  return {
    ok: true,
    message:
      "Account created. A staff member will review and approve your account, then assign you a role."
  };
}

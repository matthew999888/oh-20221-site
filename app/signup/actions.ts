"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
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

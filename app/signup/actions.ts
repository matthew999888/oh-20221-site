"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

export type SignUpState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
};

export async function signUpAction(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "")
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: SignUpState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "email" | "password";
      fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      message: "An account with that email already exists.",
      fieldErrors: { email: "Already registered." }
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

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

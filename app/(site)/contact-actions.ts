"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "That name is too long."),
  email: z
    .string()
    .trim()
    .max(160, "That email address is too long.")
    .email("Enter a valid email address."),
  subject: z.string().trim().max(120, "That subject is too long.").optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a sentence.")
    .max(4000, "That message is too long — please keep it under 4000 characters."),
  // Honeypot. A real person never sees this field, so anything in it is
  // a bot. Cheaper than a challenge and catches the unsophisticated
  // majority before Turnstile is even consulted.
  website: z.string().max(0).optional()
});

export type ContactState = {
  ok: boolean;
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "subject" | "message", string>>;
};

export async function submitContactAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const ip = getClientIp(await headers());

  // Rate limit first, before any database or network work.
  const limit = await checkRateLimit("signup", `contact:${ip}`);
  if (!limit.success) {
    return {
      ok: false,
      message: `Too many messages from this network. Please try again in about ${Math.ceil(
        limit.retryAfterSeconds / 60
      )} minute(s).`
    };
  }

  // Silently accept honeypot hits: telling a bot it failed just teaches
  // it to fix the submission.
  if (String(formData.get("website") ?? "") !== "") {
    return { ok: true, message: "Thanks — your message has been sent." };
  }

  const turnstile = await verifyTurnstile(formData.get("cf-turnstile-response")?.toString(), ip);
  if (!turnstile.success) {
    return { ok: false, message: turnstile.reason };
  }

  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
    website: String(formData.get("website") ?? "")
  });

  if (!parsed.success) {
    const fieldErrors: ContactState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<ContactState["fieldErrors"]>;
      if (key) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  await prisma.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      subject: parsed.data.subject?.trim() || null,
      message: parsed.data.message
    }
  });

  return {
    ok: true,
    message:
      "Thanks — your message has been sent to the instructor staff. They typically reply within a few school days."
  };
}

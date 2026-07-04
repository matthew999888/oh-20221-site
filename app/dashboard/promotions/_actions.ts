"use server";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { revalidatePath } from "next/cache";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type SubmitTestResult =
  | { ok: true; score: number; total: number }
  | { ok: false; message: string };

/**
 * Grades the promotion test server-side (the client never receives the
 * correct answers) and enforces a one-attempt-per-7-days limit,
 * re-checked here even though the page also hides the form client-side —
 * a user could otherwise resubmit an old page via a stale tab.
 */
export async function submitPromotionTest(answers: Record<string, string>): Promise<SubmitTestResult> {
  const session = await requirePagePermission("promotions", "view");

  const lastAttempt = await prisma.promotionTestAttempt.findFirst({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" }
  });

  if (lastAttempt && Date.now() - lastAttempt.submittedAt.getTime() < WEEK_MS) {
    const nextEligible = new Date(lastAttempt.submittedAt.getTime() + WEEK_MS);
    return {
      ok: false,
      message: `You can only take this test once every 7 days. You're eligible again on ${nextEligible.toLocaleDateString(
        undefined,
        { weekday: "long", month: "long", day: "numeric" }
      )}.`
    };
  }

  const questions = await prisma.promotionTestQuestion.findMany({ orderBy: { order: "asc" } });

  if (Object.keys(answers).length < questions.length) {
    return { ok: false, message: "Please answer every question before submitting." };
  }

  let score = 0;
  for (const q of questions) {
    if ((answers[q.id] ?? "").toUpperCase() === q.correctChoice) score++;
  }

  await prisma.promotionTestAttempt.create({
    data: { userId: session.user.id, score, totalQuestions: questions.length }
  });

  await logActivity(session.user.id, "promotion-test.submitted", "PromotionTestAttempt", undefined, {
    score,
    total: questions.length
  });

  revalidatePath("/dashboard/promotions");
  revalidatePath("/dashboard/promotion-scores");

  return { ok: true, score, total: questions.length };
}

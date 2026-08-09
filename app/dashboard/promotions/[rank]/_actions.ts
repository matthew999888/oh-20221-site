"use server";

import { requirePagePermission } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { isValidRank } from "@/lib/promotion-ranks";
import { revalidatePath } from "next/cache";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type SubmitTestResult =
  | { ok: true; score: number; total: number }
  | { ok: false; message: string };

/**
 * Grades the promotion test server-side (correct answers never sent to
 * the client) and enforces a one-attempt-per-7-days limit PER RANK,
 * re-checked here even though the page also hides the form client-side.
 */
export async function submitPromotionTest(rank: number, answers: Record<string, string>): Promise<SubmitTestResult> {
  if (!isValidRank(rank)) {
    return { ok: false, message: "Invalid rank." };
  }

  const session = await requirePagePermission("promotions", "view");

  const lastAttempt = await prisma.promotionTestAttempt.findFirst({
    where: { userId: session.user.id, rank },
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

  const questions = await prisma.promotionTestQuestion.findMany({ where: { rank }, orderBy: { order: "asc" } });

  const answered = questions.filter((q) => (answers[q.id] ?? "").trim() !== "");
  if (answered.length < questions.length) {
    return { ok: false, message: "Please answer every question before submitting." };
  }

  // Multiple choice grades now; short and long answers are stored
  // unscored for a person to grade. `score` therefore reflects only the
  // auto-gradable part — `totalQuestions` still counts everything, so a
  // test with written questions reads as incomplete until graded, which
  // is accurate.
  let score = 0;
  let autoGradable = 0;
  for (const q of questions) {
    if (q.type !== "multiple_choice") continue;
    autoGradable++;
    if ((answers[q.id] ?? "").toUpperCase() === q.correctChoice) score++;
  }

  const attempt = await prisma.promotionTestAttempt.create({
    data: { userId: session.user.id, rank, score, totalQuestions: questions.length }
  });

  // Persist every response so written answers can be graded later and
  // so a cadet's actual answers are reviewable, not just their total.
  await prisma.promotionTestResponse.createMany({
    data: questions.map((q) => {
      const raw = (answers[q.id] ?? "").trim();
      const mc = q.type === "multiple_choice";
      return {
        attemptId: attempt.id,
        questionId: q.id,
        selectedChoice: mc ? raw.toUpperCase() : null,
        writtenAnswer: mc ? null : raw,
        awardedPoints: mc ? (raw.toUpperCase() === q.correctChoice ? q.points : 0) : null,
        gradedAt: mc ? new Date() : null
      };
    })
  });

  await logActivity(session.user.id, "promotion-test.submitted", "PromotionTestAttempt", undefined, {
    rank,
    score,
    total: questions.length
  });

  revalidatePath("/dashboard/promotions");
  revalidatePath(`/dashboard/promotions/${rank}`);
  revalidatePath("/dashboard/promotion-scores");

  return { ok: true, score, total: questions.length };
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RANK_NAMES, isValidRank } from "@/lib/promotion-ranks";
import PromotionTestClient from "./PromotionTestClient";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function PromotionRankTestPage({ params }: { params: { rank: string } }) {
  const rank = parseInt(params.rank, 10);
  if (!isValidRank(rank)) notFound();

  const session = await requirePagePermission("promotions", "view");
  const info = RANK_NAMES[rank];

  const [questions, lastAttempt] = await Promise.all([
    prisma.promotionTestQuestion.findMany({
      where: { rank },
      orderBy: { order: "asc" },
      select: { id: true, order: true, questionText: true, choiceA: true, choiceB: true, choiceC: true, choiceD: true }
    }),
    prisma.promotionTestAttempt.findFirst({
      where: { userId: session.user.id, rank },
      orderBy: { submittedAt: "desc" }
    })
  ]);

  let nextEligibleAt: string | null = null;
  if (lastAttempt) {
    const eligible = lastAttempt.submittedAt.getTime() + WEEK_MS;
    if (Date.now() < eligible) nextEligibleAt = new Date(eligible).toISOString();
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">
        {info.payGrade} &middot; {info.name} Promotion Test
      </h1>
      <p className="dash-page__subtitle">
        Answer all {questions.length} questions, then submit. You may retake this specific test once every 7 days.
      </p>

      <PromotionTestClient
        rank={rank}
        questions={questions}
        nextEligibleAt={nextEligibleAt}
        lastScore={lastAttempt ? { score: lastAttempt.score, total: lastAttempt.totalQuestions } : null}
      />
    </div>
  );
}

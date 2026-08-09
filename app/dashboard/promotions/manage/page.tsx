export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { RANK_NAMES } from "@/lib/promotion-ranks";
import TestBuilder, { type BuilderQuestion } from "./TestBuilder";

export default async function PromotionTestManagePage({
  searchParams
}: {
  searchParams: Promise<{ rank?: string }>;
}) {
  // Gated on `promotion-tests-admin`, granted to command staff and the
  // Training Officer (see lib/permissions.ts). Deliberately separate
  // from the `promotions` key, which is what lets every cadet SIT a
  // test — authoring and taking are different privileges.
  await requirePagePermission("promotion-tests-admin", "edit");

  const { rank: rankParam } = await searchParams;
  const ranks = Object.keys(RANK_NAMES)
    .map(Number)
    .sort((a, b) => a - b);
  const rank = ranks.includes(Number(rankParam)) ? Number(rankParam) : ranks[0];

  const questions = await prisma.promotionTestQuestion.findMany({
    where: { rank },
    orderBy: { order: "asc" }
  });

  const dto: BuilderQuestion[] = questions.map((q) => ({
    id: q.id,
    order: q.order,
    questionText: q.questionText,
    type: q.type,
    choiceA: q.choiceA ?? "",
    choiceB: q.choiceB ?? "",
    choiceC: q.choiceC ?? "",
    choiceD: q.choiceD ?? "",
    correctChoice: q.correctChoice ?? "A",
    answerKey: q.answerKey ?? "",
    points: q.points
  }));

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Promotion Test Builder</h1>
      <p className="dash-page__subtitle">
        Build the test for each rank. Multiple choice is graded automatically the moment a cadet
        submits; short and long answers are held for a person to grade.
      </p>

      <TestBuilder
        rank={rank}
        ranks={ranks.map((r) => ({ value: r, label: RANK_NAMES[r]?.name ?? `Rank ${r}` }))}
        initial={dto}
      />
    </div>
  );
}

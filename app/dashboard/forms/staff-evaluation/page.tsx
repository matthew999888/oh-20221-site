export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import StaffEvaluationForm from "./StaffEvaluationForm";

export default async function StaffEvaluationPage() {
  const session = await requirePagePermission("cadet-forms", "view");

  const evaluations = await prisma.staffEvaluation.findMany({
    where: { evaluatorId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <StaffEvaluationForm
      initialEvaluations={evaluations.map((e) => ({
        id: e.id,
        cadetName: e.cadetName,
        cadetRank: e.cadetRank,
        cadetFlight: e.cadetFlight,
        evalDate: e.evalDate.toISOString(),
        readiness: e.readiness,
        totalScore: e.totalScore,
        createdAt: e.createdAt.toISOString()
      }))}
    />
  );
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export type EvaluationInput = {
  cadetName: string;
  cadetRank: string;
  cadetFlight: string;
  evalDate: string; // yyyy-mm-dd
  readiness: "ready" | "not-ready" | "";
  ratings: Record<string, number | null>;
  comments: Record<string, string>;
  totalScore: number;
};

export async function submitEvaluation(data: EvaluationInput) {
  const session = await requirePagePermission("cadet-forms", "view");

  const evaluation = await prisma.staffEvaluation.create({
    data: {
      evaluatorId: session.user.id,
      cadetName: data.cadetName.trim() || "Unnamed cadet",
      cadetRank: data.cadetRank.trim() || null,
      cadetFlight: data.cadetFlight.trim() || null,
      evalDate: new Date(data.evalDate),
      readiness: data.readiness || null,
      ratings: data.ratings,
      comments: data.comments,
      totalScore: data.totalScore
    }
  });

  await logActivity(session.user.id, "staff-evaluation.submitted", "StaffEvaluation", evaluation.id, {
    cadetName: data.cadetName
  });
  revalidatePath("/dashboard/forms/staff-evaluation");
  return evaluation;
}

export async function getMyEvaluations() {
  const session = await requirePagePermission("cadet-forms", "view");
  return prisma.staffEvaluation.findMany({
    where: { evaluatorId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function deleteEvaluation(id: string) {
  const session = await requirePagePermission("cadet-forms", "view");
  await prisma.staffEvaluation.deleteMany({ where: { id, evaluatorId: session.user.id } });
  revalidatePath("/dashboard/forms/staff-evaluation");
}

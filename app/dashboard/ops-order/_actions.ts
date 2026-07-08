"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export type OpsOrderStatusInput = {
  uniformOfTheDay: string;
  ptDay: string;
  ptDetails: string;
  honorCode: string;
  honorCodeTitle: string;
  honorCodeLead: string;
};

export async function updateOpsOrderStatus(data: OpsOrderStatusInput) {
  const session = await assertPagePermission("ops-order", "edit");

  const status = await prisma.opsOrderStatus.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      uniformOfTheDay: data.uniformOfTheDay.trim() || null,
      ptDay: data.ptDay.trim() || null,
      ptDetails: data.ptDetails.trim() || null,
      honorCode: data.honorCode.trim() || null,
      honorCodeTitle: data.honorCodeTitle.trim() || null,
      honorCodeLead: data.honorCodeLead.trim() || null,
      updatedBy: session.user.id
    },
    update: {
      uniformOfTheDay: data.uniformOfTheDay.trim() || null,
      ptDay: data.ptDay.trim() || null,
      ptDetails: data.ptDetails.trim() || null,
      honorCode: data.honorCode.trim() || null,
      honorCodeTitle: data.honorCodeTitle.trim() || null,
      honorCodeLead: data.honorCodeLead.trim() || null,
      updatedBy: session.user.id
    }
  });

  await logActivity(session.user.id, "ops-order-status.updated", "OpsOrderStatus", status.id);
  revalidatePath("/dashboard/ops-order");
  return status;
}

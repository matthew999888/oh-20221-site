"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export type JournalEntryInput = {
  period: string;
  jobTitle: string;
  didThisMonth: string;
  comingUp: string;
  barriers: string;
};

export async function submitJournalEntry(data: JournalEntryInput) {
  const session = await requirePagePermission("cadet-forms", "view");

  const entry = await prisma.staffJournalEntry.create({
    data: {
      authorId: session.user.id,
      period: data.period.trim(),
      jobTitle: data.jobTitle.trim(),
      didThisMonth: data.didThisMonth.trim(),
      comingUp: data.comingUp.trim(),
      barriers: data.barriers.trim()
    }
  });

  await logActivity(session.user.id, "staff-journal.submitted", "StaffJournalEntry", entry.id);
  revalidatePath("/dashboard/forms/staff-journal");
  return entry;
}

export async function getMyJournalEntries() {
  const session = await requirePagePermission("cadet-forms", "view");
  return prisma.staffJournalEntry.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
}

export async function deleteJournalEntry(id: string) {
  const session = await requirePagePermission("cadet-forms", "view");
  await prisma.staffJournalEntry.deleteMany({ where: { id, authorId: session.user.id } });
  revalidatePath("/dashboard/forms/staff-journal");
}

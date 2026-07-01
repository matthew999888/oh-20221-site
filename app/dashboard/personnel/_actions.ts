"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export type RosterEntryInput = {
  firstName: string;
  lastName: string;
  grade: number | null;
  flight: string;
  rank: string;
  positionTitle: string;
  active: boolean;
};

function revalidateRosterPages() {
  revalidatePath("/dashboard/personnel");
  revalidatePath("/dashboard/roster");
  revalidatePath("/roster");
}

export async function createRosterEntry(data: RosterEntryInput) {
  const session = await assertPagePermission("personnel", "edit");

  const entry = await prisma.rosterEntry.create({
    data: {
      firstName: data.firstName.trim() || "Unknown",
      lastName: data.lastName.trim() || "Cadet",
      grade: data.grade,
      flight: data.flight.trim() || null,
      rank: data.rank.trim() || null,
      positionTitle: data.positionTitle.trim() || null,
      active: data.active
    }
  });

  await logActivity(session.user.id, "roster-entry.created", "RosterEntry", entry.id);
  revalidateRosterPages();
  return entry;
}

export async function updateRosterEntry(id: string, data: RosterEntryInput) {
  const session = await assertPagePermission("personnel", "edit");

  const entry = await prisma.rosterEntry.update({
    where: { id },
    data: {
      firstName: data.firstName.trim() || "Unknown",
      lastName: data.lastName.trim() || "Cadet",
      grade: data.grade,
      flight: data.flight.trim() || null,
      rank: data.rank.trim() || null,
      positionTitle: data.positionTitle.trim() || null,
      active: data.active
    }
  });

  await logActivity(session.user.id, "roster-entry.updated", "RosterEntry", id);
  revalidateRosterPages();
  return entry;
}

export async function toggleRosterEntryActive(id: string, active: boolean) {
  const session = await assertPagePermission("personnel", "edit");

  const entry = await prisma.rosterEntry.update({ where: { id }, data: { active } });

  await logActivity(session.user.id, active ? "roster-entry.reactivated" : "roster-entry.deactivated", "RosterEntry", id);
  revalidateRosterPages();
  return entry;
}

export async function deleteRosterEntry(id: string) {
  const session = await assertPagePermission("personnel", "edit");

  await prisma.rosterEntry.delete({ where: { id } });

  await logActivity(session.user.id, "roster-entry.deleted", "RosterEntry", id);
  revalidateRosterPages();
}

export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import PersonnelClient, { type PersonnelRosterEntry } from "./PersonnelClient";

export default async function PersonnelPage() {
  await requirePagePermission("personnel", "edit");

  const entries = await prisma.rosterEntry.findMany({
    orderBy: [{ active: "desc" }, { flight: "asc" }, { lastName: "asc" }]
  });

  const initial: PersonnelRosterEntry[] = entries.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    grade: e.grade,
    flight: e.flight,
    rank: e.rank,
    positionTitle: e.positionTitle,
    active: e.active
  }));

  return <PersonnelClient initial={initial} />;
}

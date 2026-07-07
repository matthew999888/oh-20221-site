export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RosterClient from "./RosterClient";

export const metadata: Metadata = {
  title: "Cadet Roster",
  description: "Current active cadets of OH-20221 AFJROTC."
};

// Public, read-only rendering of the active roster. All edits happen on
// /dashboard/personnel (Personnel Officer / 1st Sergeant / admin only) —
// this page and /dashboard/roster both just render the same data.
export default async function PublicRosterPage() {
  const roster = await prisma.rosterEntry.findMany({
    where: { active: true },
    orderBy: [{ flight: "asc" }, { lastName: "asc" }]
  });

  return (
    <main className="page-section">
      <h1 className="page-section__title">Cadet Roster</h1>
      <p className="page-section__sub">
        Current active cadets of OH-20221 AFJROTC &middot; {roster.length} cadet{roster.length === 1 ? "" : "s"}
      </p>

      <RosterClient
        roster={roster.map((c) => ({
          id: c.id,
          name: `${c.lastName}, ${c.firstName}`,
          rank: c.rank,
          grade: c.grade,
          flight: c.flight,
          positionTitle: c.positionTitle
        }))}
      />
    </main>
  );
}

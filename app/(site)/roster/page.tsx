export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "../PageHeader";
import RosterClient from "./RosterClient";

export const metadata: Metadata = {
  title: "Cadet Roster",
  description: "Current active cadets of OH-20221 AFJROTC."
};

// Public, read-only rendering of the active roster. All edits happen on
// /dashboard/personnel (Personnel Officer / 1st Sergeant / admin only) —
// this page and /dashboard/roster both render the same underlying data,
// but this one additionally honors FERPA directory opt-outs.
export default async function PublicRosterPage() {
  const roster = await prisma.rosterEntry.findMany({
    // directoryOptOut excludes cadets whose parent or eligible student has
    // refused public disclosure of directory information under FERPA
    // (34 CFR § 99.37). They still appear in the authenticated portal.
    where: { active: true, directoryOptOut: false },
    orderBy: [{ flight: "asc" }, { lastName: "asc" }]
  });

  return (
    <>
      <PageHeader
        eyebrow="Unit Personnel"
        title="Cadet Roster"
        lede={`Current active cadets of OH-20221 AFJROTC — ${roster.length} cadet${
          roster.length === 1 ? "" : "s"
        } listed.`}
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
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

          <p className="pub-callout">
            This roster lists <strong>directory information</strong> only. Under the Family
            Educational Rights and Privacy Act, a parent or eligible student may ask that a cadet
            not be listed publicly — email{" "}
            <a href="mailto:lroberts@lhsd.k12.oh.us">lroberts@lhsd.k12.oh.us</a> and the cadet will
            be removed from this page. See our <Link href="/privacy">Privacy Policy</Link> for
            details.
          </p>
        </div>
      </div>
    </>
  );
}

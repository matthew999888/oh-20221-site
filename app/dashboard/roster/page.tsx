export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requirePagePermission, canEdit } from "@/lib/permissions";
import { getContentBlock } from "@/lib/content-blocks";
import ContentBlockSection from "@/components/dashboard/ContentBlockSection";

export default async function RosterPage() {
  const session = await requirePagePermission("roster", "view");
  const block = await getContentBlock("roster", {
    title: "Cadet Roster",
    description: "Current unit roster. This list is read-only here — roster edits happen on the Personnel page."
  });
  // Edit rights only apply to the notes/sections above; the table itself
  // is always presented read-only on this page, per the roster's
  // "read-only" requirement.
  const editable = canEdit(session.user.roles, "roster");

  const roster = await prisma.rosterEntry.findMany({
    where: { active: true },
    orderBy: [{ flight: "asc" }, { lastName: "asc" }]
  });

  return (
    <div className="dash-page">
      <ContentBlockSection
        page="roster"
        path="/dashboard/roster"
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Roster ({roster.length})</h2>
        </header>
        {roster.length === 0 ? (
          <p className="content-block__empty">No active cadets on record yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rank</th>
                  <th>Grade</th>
                  <th>Flight</th>
                  <th>Position</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((c) => (
                  <tr key={c.id}>
                    <td>{c.lastName}, {c.firstName}</td>
                    <td>{c.rank ?? "—"}</td>
                    <td>{c.grade ?? "—"}</td>
                    <td>{c.flight ?? "—"}</td>
                    <td>{c.positionTitle ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

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
      <p className="page-section__sub">Current active cadets of OH-20221 AFJROTC.</p>

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
                  <td>
                    {c.lastName}, {c.firstName}
                  </td>
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
    </main>
  );
}

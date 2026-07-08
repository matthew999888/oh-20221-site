export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function StaffFormsReviewPage() {
  await requirePagePermission("staff-forms-review", "view");

  const [journalEntries, evaluations] = await Promise.all([
    prisma.staffJournalEntry.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true, email: true } } }
    }),
    prisma.staffEvaluation.findMany({
      orderBy: { createdAt: "desc" },
      include: { evaluator: { select: { name: true, email: true } } }
    })
  ]);

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Staff Forms Review</h1>
      <p className="dash-page__subtitle">
        Visible to command staff only. Every submitted Staff Journal Entry and Staff Cadet Evaluation, from every
        user, most recent first.
      </p>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Staff Journal Entries ({journalEntries.length})</h2>
        </header>
        {journalEntries.length === 0 ? (
          <p className="content-block__empty">No journal entries submitted yet.</p>
        ) : (
          <ul className="dash-list" style={{ flexDirection: "column", alignItems: "stretch", gap: "1.25rem" }}>
            {journalEntries.map((e) => (
              <li
                key={e.id}
                style={{ display: "block", borderBottom: "1px solid rgba(139,92,200,0.15)", paddingBottom: "1.1rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                  <strong>
                    {e.author.name} — {e.jobTitle} ({e.period})
                  </strong>
                  <span className="dash-list__meta">
                    {e.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--text-200)" }}>
                  <strong>Did this month:</strong> {e.didThisMonth}
                </p>
                {e.comingUp && (
                  <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--text-300)" }}>
                    <strong>Coming up:</strong> {e.comingUp}
                  </p>
                )}
                {e.barriers && (
                  <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--text-300)" }}>
                    <strong>Barriers:</strong> {e.barriers}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Staff Cadet Evaluations ({evaluations.length})</h2>
        </header>
        {evaluations.length === 0 ? (
          <p className="content-block__empty">No evaluations submitted yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cadet</th>
                <th>Evaluator</th>
                <th>Date</th>
                <th>Score</th>
                <th>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.cadetName}
                    {e.cadetRank ? ` (${e.cadetRank})` : ""}
                    {e.cadetFlight ? ` · ${e.cadetFlight}` : ""}
                  </td>
                  <td>{e.evaluator.name}</td>
                  <td>
                    {e.evalDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td>{e.totalScore} / 50</td>
                  <td>{e.readiness === "ready" ? "Ready" : e.readiness === "not-ready" ? "Not ready" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

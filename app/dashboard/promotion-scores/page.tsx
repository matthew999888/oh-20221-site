export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function PromotionScoresPage() {
  await requirePagePermission("promotion-scores", "view");

  const users = await prisma.user.findMany({
    where: { status: "approved" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      promotionTestAttempts: {
        orderBy: { submittedAt: "desc" },
        select: { score: true, totalQuestions: true, submittedAt: true }
      }
    }
  });

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Promotion Test Scores</h1>
      <p className="dash-page__subtitle">
        Visible to command staff only. Shows every approved user's most recent attempt and total attempts taken.
      </p>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>All Users ({users.length})</h2>
        </header>
        {users.length === 0 ? (
          <p className="content-block__empty">No approved users yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Latest Score</th>
                <th>Latest Attempt</th>
                <th>Total Attempts</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const latest = u.promotionTestAttempts[0];
                return (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      {latest ? (
                        <strong>
                          {latest.score} / {latest.totalQuestions} (
                          {Math.round((latest.score / latest.totalQuestions) * 100)}%)
                        </strong>
                      ) : (
                        <span className="content-block__empty">Not taken yet</span>
                      )}
                    </td>
                    <td>
                      {latest
                        ? latest.submittedAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })
                        : "—"}
                    </td>
                    <td>{u.promotionTestAttempts.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

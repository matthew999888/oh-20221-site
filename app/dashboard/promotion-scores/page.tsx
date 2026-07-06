export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RANK_NAMES } from "@/lib/promotion-ranks";

export default async function PromotionScoresPage() {
  await requirePagePermission("promotion-scores", "view");

  const attempts = await prisma.promotionTestAttempt.findMany({
    orderBy: { submittedAt: "desc" },
    include: { user: { select: { name: true, email: true } } }
  });

  const totalUsers = await prisma.user.count({ where: { status: "approved" } });

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Promotion Test Scores</h1>
      <p className="dash-page__subtitle">
        Visible to command staff only. Shows every submitted attempt across all 9 rank tests, most recent first.
      </p>

      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>
            All Attempts ({attempts.length}) &middot; {totalUsers} Approved Users
          </h2>
        </header>
        {attempts.length === 0 ? (
          <p className="content-block__empty">No promotion tests have been taken yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Rank Tested</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const info = RANK_NAMES[a.rank];
                const pct = Math.round((a.score / a.totalQuestions) * 100);
                return (
                  <tr key={a.id}>
                    <td>{a.user.name}</td>
                    <td>{a.user.email}</td>
                    <td>
                      {info ? `${info.payGrade} · ${info.name}` : `Rank ${a.rank}`}
                    </td>
                    <td>
                      <strong>
                        {a.score} / {a.totalQuestions} ({pct}%)
                      </strong>
                    </td>
                    <td>
                      {a.submittedAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </td>
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

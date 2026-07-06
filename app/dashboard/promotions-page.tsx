export const dynamic = "force-dynamic";

import Link from "next/link";
import { requirePagePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { RANK_NAMES, RANK_ORDER } from "@/lib/promotion-ranks";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function PromotionsPage() {
  const session = await requirePagePermission("promotions", "view");

  const attempts = await prisma.promotionTestAttempt.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" }
  });

  // Most recent attempt per rank
  const latestByRank = new Map<number, (typeof attempts)[number]>();
  for (const a of attempts) {
    if (!latestByRank.has(a.rank)) latestByRank.set(a.rank, a);
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Promotion Tests</h1>
      <p className="dash-page__subtitle">
        Choose a rank to test for. Each test is 100 questions, and you may retake any individual test once every 7
        days.
      </p>

      <div className="dash-grid">
        {RANK_ORDER.map((rank) => {
          const info = RANK_NAMES[rank];
          const latest = latestByRank.get(rank);
          let locked = false;
          let nextEligibleLabel = "";
          if (latest) {
            const eligible = latest.submittedAt.getTime() + WEEK_MS;
            if (Date.now() < eligible) {
              locked = true;
              nextEligibleLabel = new Date(eligible).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
              });
            }
          }

          return (
            <Link
              href={`/dashboard/promotions/${rank}`}
              key={rank}
              className="dash-card"
              style={{ textDecoration: "none", display: "block" }}
            >
              <header className="dash-card__header">
                <h2>
                  {info.payGrade} &middot; {info.name}
                </h2>
              </header>
              <p className="info-card__meta">{info.abbr}</p>
              {latest ? (
                <p className="content-block__empty">
                  Last score: <strong>{latest.score} / {latest.totalQuestions}</strong>
                  {locked && <> &middot; locked until {nextEligibleLabel}</>}
                </p>
              ) : (
                <p className="content-block__empty">Not taken yet</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

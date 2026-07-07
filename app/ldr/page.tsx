export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { listLdrRoles } from "@/lib/org";

export const metadata: Metadata = {
  title: "Teams & Activities",
  description: "LDR teams, committees, and competitive activities — OH-20221 AFJROTC."
};

export default async function LdrIndexPage() {
  const teams = await listLdrRoles();

  return (
    <main className="page-section">
      <h1 className="page-section__title">Teams &amp; Activities</h1>
      <p className="page-section__sub">LDR teams, committees, and competitive activities.</p>

      {teams.length === 0 ? (
        <p className="content-block__empty">No teams have been set up yet.</p>
      ) : (
        <div className="card-grid">
          {teams.map((t) => (
            <Link href={`/ldr/${t.slug}`} key={t.id} className="info-card info-card--nav">
              <h3>{t.name}</h3>
              <span className="info-card__cta">
                View team <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

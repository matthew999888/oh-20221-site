export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { listLdrRoles } from "@/lib/org";
import PageHeader from "../PageHeader";

export const metadata: Metadata = {
  title: "Teams & Activities",
  description: "LDR teams, committees, and competitive activities — OH-20221 AFJROTC."
};

export default async function LdrIndexPage() {
  const teams = await listLdrRoles();

  return (
    <>
      <PageHeader
        eyebrow="Unit Organization"
        title="Teams & Activities"
        lede="LDR teams, committees, and competitive activities."
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          {teams.length === 0 ? (
            <p className="pub-empty">No teams have been set up yet.</p>
          ) : (
            <div className="pub-grid">
              {teams.map((t) => (
                <Link href={`/ldr/${t.slug}`} key={t.id} className="pub-card">
                  <h2 className="pub-card__title">{t.name}</h2>
                  <span className="pub-viewall" style={{ marginTop: "auto" }}>
                    View team
                    <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

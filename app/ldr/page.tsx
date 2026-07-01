export const dynamic = "force-dynamic";

import Link from "next/link";
import { listLdrRoles } from "@/lib/org";

export default async function LdrIndexPage() {
  const teams = await listLdrRoles();

  return (
    <main className="page-section">
      <h1 className="page-section__title">Teams &amp; Activities</h1>
      <p className="page-section__sub">LDR teams, committees, and competitive activities.</p>

      <div className="card-grid">
        {teams.map((t) => (
          <Link href={`/ldr/${t.slug}`} key={t.id} className="info-card">
            <h3>{t.name}</h3>
          </Link>
        ))}
      </div>
    </main>
  );
}

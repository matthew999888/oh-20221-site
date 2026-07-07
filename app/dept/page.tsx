export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { listDepartmentRoles } from "@/lib/org";

export const metadata: Metadata = {
  title: "Departments",
  description: "Unit staff sections and the officers who lead them — OH-20221 AFJROTC."
};

export default async function DepartmentsIndexPage() {
  const departments = await listDepartmentRoles();

  return (
    <main className="page-section">
      <h1 className="page-section__title">Departments</h1>
      <p className="page-section__sub">Unit staff sections and the officers who lead them.</p>

      {departments.length === 0 ? (
        <p className="content-block__empty">No departments have been set up yet.</p>
      ) : (
        <div className="card-grid">
          {departments.map((d) => (
            <Link href={`/dept/${d.slug}`} key={d.id} className="info-card info-card--nav">
              <h3>{d.name}</h3>
              <span className="info-card__cta">
                View department <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

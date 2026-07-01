export const dynamic = "force-dynamic";

import Link from "next/link";
import { listDepartmentRoles } from "@/lib/org";

export default async function DepartmentsIndexPage() {
  const departments = await listDepartmentRoles();

  return (
    <main className="page-section">
      <h1 className="page-section__title">Departments</h1>
      <p className="page-section__sub">Unit staff sections and the officers who lead them.</p>

      <div className="card-grid">
        {departments.map((d) => (
          <Link href={`/dept/${d.slug}`} key={d.id} className="info-card">
            <h3>{d.name}</h3>
          </Link>
        ))}
      </div>
    </main>
  );
}

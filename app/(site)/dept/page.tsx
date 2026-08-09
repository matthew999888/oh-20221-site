export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { listDepartmentRoles } from "@/lib/org";
import PageHeader from "../PageHeader";

export const metadata: Metadata = {
  title: "Departments",
  description: "Unit staff sections and the officers who lead them — OH-20221 AFJROTC."
};

export default async function DepartmentsIndexPage() {
  const departments = await listDepartmentRoles();

  return (
    <>
      <PageHeader
        eyebrow="Unit Organization"
        title="Departments"
        lede="Unit staff sections and the officers who lead them."
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          {departments.length === 0 ? (
            <p className="pub-empty">No departments have been set up yet.</p>
          ) : (
            <div className="pub-grid">
              {departments.map((d) => (
                <Link href={`/dept/${d.slug}`} key={d.id} className="pub-card">
                  <h2 className="pub-card__title">{d.name}</h2>
                  <span className="pub-viewall" style={{ marginTop: "auto" }}>
                    View department
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

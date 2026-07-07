export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditDepartment } from "@/lib/permissions";
import { getDepartmentRole } from "@/lib/org";
import DeptContentEditor from "./DeptContentEditor";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const role = await getDepartmentRole(params.slug);
  return {
    title: role.name,
    description: `Information and resources from the ${role.name} — OH-20221 AFJROTC.`
  };
}

export default async function DepartmentPage({ params }: { params: { slug: string } }) {
  const role = await getDepartmentRole(params.slug);
  const session = await getServerSession(authOptions);
  const roleSlugs = session?.user.roles ?? [];
  const editable = canEditDepartment(roleSlugs, role.slug);

  const key = `dept:${role.slug}`;
  const block =
    (await prisma.contentBlock.findUnique({
      where: { key },
      include: { boxes: { orderBy: { order: "asc" } } }
    })) ??
    (await prisma.contentBlock.create({
      data: {
        key,
        title: role.name,
        description: `Information and resources from the ${role.name}.`
      },
      include: { boxes: { orderBy: { order: "asc" } } }
    }));

  return (
    <main className="page-section">
      <Link href="/dashboard" className="back-link">
        <i className="fa-solid fa-arrow-left" /> Back to dashboard
      </Link>

      {editable && (
        <p className="content-block__empty" style={{ marginBottom: "1rem" }}>
          <i className="fa-solid fa-pen" /> You're signed in as this department's officer — edits save instantly.
        </p>
      )}

      <DeptContentEditor
        deptSlug={role.slug}
        contentBlockId={block.id}
        initialTitle={block.title}
        initialDescription={block.description ?? ""}
        initialBoxes={block.boxes}
        canEdit={editable}
      />
    </main>
  );
}

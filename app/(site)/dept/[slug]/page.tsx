export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditDepartment } from "@/lib/permissions";
import { getDepartmentRole } from "@/lib/org";
import PageHeader from "../../PageHeader";
import DeptContentEditor from "./DeptContentEditor";

// Next 15: `params` is a Promise and must be awaited.
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const role = await getDepartmentRole(slug);
  return {
    title: role.name,
    description: `Information and resources from the ${role.name} — OH-20221 AFJROTC.`
  };
}

export default async function DepartmentPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = await getDepartmentRole(slug);
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
    <>
      {/* No <main> here — app/(site)/layout.tsx already provides one, and
          a second would be a duplicate landmark. The old "back to
          dashboard" link was replaced by a breadcrumb because this page
          is public: a signed-out visitor following it hit the login wall. */}
      <PageHeader
        eyebrow="Department"
        title={role.name}
        crumbs={[{ href: "/dept", label: "Departments" }]}
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          {editable && (
            <p className="pub-callout" style={{ marginTop: 0 }}>
              <i className="fa-solid fa-pen" aria-hidden="true" /> You&rsquo;re signed in as this
              department&rsquo;s officer — edits save instantly.
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
        </div>
      </div>
    </>
  );
}

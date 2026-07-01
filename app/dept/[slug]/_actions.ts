"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertDepartmentEdit } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

export async function updateDeptContentMeta(
  deptSlug: string,
  contentBlockId: string,
  data: { title: string; description: string }
) {
  const session = await assertDepartmentEdit(deptSlug);

  await prisma.contentBlock.update({
    where: { id: contentBlockId },
    data: {
      title: data.title.trim() || "Untitled",
      description: data.description.trim() || null,
      updatedBy: session.user.id
    }
  });

  await logActivity(session.user.id, "dept-content.updated", "ContentBlock", contentBlockId, { deptSlug });
  revalidatePath(`/dept/${deptSlug}`);
}

export async function createDeptContentBox(deptSlug: string, contentBlockId: string) {
  const session = await assertDepartmentEdit(deptSlug);

  const last = await prisma.contentBlockBox.findFirst({
    where: { contentBlockId },
    orderBy: { order: "desc" }
  });

  const box = await prisma.contentBlockBox.create({
    data: {
      contentBlockId,
      title: "New section",
      body: "",
      order: (last?.order ?? -1) + 1,
      updatedBy: session.user.id
    }
  });

  await logActivity(session.user.id, "dept-content-box.created", "ContentBlockBox", box.id, { deptSlug });
  revalidatePath(`/dept/${deptSlug}`);
  return box;
}

export async function updateDeptContentBox(deptSlug: string, boxId: string, data: { title: string; body: string }) {
  const session = await assertDepartmentEdit(deptSlug);

  await prisma.contentBlockBox.update({
    where: { id: boxId },
    data: {
      title: data.title.trim() || "Untitled",
      body: data.body,
      updatedBy: session.user.id
    }
  });

  await logActivity(session.user.id, "dept-content-box.updated", "ContentBlockBox", boxId, { deptSlug });
  revalidatePath(`/dept/${deptSlug}`);
}

export async function deleteDeptContentBox(deptSlug: string, boxId: string) {
  const session = await assertDepartmentEdit(deptSlug);

  await prisma.contentBlockBox.delete({ where: { id: boxId } });

  await logActivity(session.user.id, "dept-content-box.deleted", "ContentBlockBox", boxId, { deptSlug });
  revalidatePath(`/dept/${deptSlug}`);
}

export async function reorderDeptContentBoxes(deptSlug: string, orderedIds: string[]) {
  const session = await assertDepartmentEdit(deptSlug);

  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.contentBlockBox.update({ where: { id }, data: { order: index } }))
  );

  await logActivity(session.user.id, "dept-content-box.reordered", "ContentBlock", orderedIds[0] ?? "", { deptSlug });
  revalidatePath(`/dept/${deptSlug}`);
}

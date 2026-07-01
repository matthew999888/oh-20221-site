"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission, type PageKey } from "@/lib/permissions";

async function logEdit(userId: string, action: string, targetId: string) {
  await prisma.activityLog.create({
    data: { userId, action, targetType: "ContentBlock", targetId }
  }).catch(() => {
    // Activity logging is best-effort; never block the edit on it.
  });
}

export async function updateContentBlockMeta(
  page: PageKey,
  contentBlockId: string,
  data: { title: string; description: string },
  path: string
) {
  const session = await assertPagePermission(page, "edit");

  await prisma.contentBlock.update({
    where: { id: contentBlockId },
    data: {
      title: data.title.trim() || "Untitled",
      description: data.description.trim() || null,
      updatedBy: session.user.id
    }
  });

  await logEdit(session.user.id, "content-block.updated", contentBlockId);
  revalidatePath(path);
}

export async function createContentBlockBox(
  page: PageKey,
  contentBlockId: string,
  path: string
) {
  const session = await assertPagePermission(page, "edit");

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

  await logEdit(session.user.id, "content-block-box.created", box.id);
  revalidatePath(path);
  return box;
}

export async function updateContentBlockBox(
  page: PageKey,
  boxId: string,
  data: { title: string; body: string },
  path: string
) {
  const session = await assertPagePermission(page, "edit");

  await prisma.contentBlockBox.update({
    where: { id: boxId },
    data: {
      title: data.title.trim() || "Untitled",
      body: data.body,
      updatedBy: session.user.id
    }
  });

  await logEdit(session.user.id, "content-block-box.updated", boxId);
  revalidatePath(path);
}

export async function deleteContentBlockBox(page: PageKey, boxId: string, path: string) {
  const session = await assertPagePermission(page, "edit");

  await prisma.contentBlockBox.delete({ where: { id: boxId } });

  await logEdit(session.user.id, "content-block-box.deleted", boxId);
  revalidatePath(path);
}

/**
 * Reorders boxes given the full ordered list of box ids (drag-and-drop or
 * up/down controls in the UI both reduce to "here's the new order").
 */
export async function reorderContentBlockBoxes(page: PageKey, orderedIds: string[], path: string) {
  const session = await assertPagePermission(page, "edit");

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.contentBlockBox.update({ where: { id }, data: { order: index } })
    )
  );

  await logEdit(session.user.id, "content-block-box.reordered", orderedIds[0] ?? "");
  revalidatePath(path);
}

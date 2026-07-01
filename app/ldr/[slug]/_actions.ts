"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertLdrEdit, requireApprovedSession } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

function path(ldrSlug: string) {
  return `/ldr/${ldrSlug}`;
}

// ---------------------------------------------------------------------
// Content block (same pattern as dept/[slug])
// ---------------------------------------------------------------------

export async function updateLdrContentMeta(
  ldrSlug: string,
  contentBlockId: string,
  data: { title: string; description: string }
) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.contentBlock.update({
    where: { id: contentBlockId },
    data: {
      title: data.title.trim() || "Untitled",
      description: data.description.trim() || null,
      updatedBy: session.user.id
    }
  });
  await logActivity(session.user.id, "ldr-content.updated", "ContentBlock", contentBlockId, { ldrSlug });
  revalidatePath(path(ldrSlug));
}

export async function createLdrContentBox(ldrSlug: string, contentBlockId: string) {
  const session = await assertLdrEdit(ldrSlug);
  const last = await prisma.contentBlockBox.findFirst({ where: { contentBlockId }, orderBy: { order: "desc" } });
  const box = await prisma.contentBlockBox.create({
    data: {
      contentBlockId,
      title: "New section",
      body: "",
      order: (last?.order ?? -1) + 1,
      updatedBy: session.user.id
    }
  });
  await logActivity(session.user.id, "ldr-content-box.created", "ContentBlockBox", box.id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return box;
}

export async function updateLdrContentBox(ldrSlug: string, boxId: string, data: { title: string; body: string }) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.contentBlockBox.update({
    where: { id: boxId },
    data: { title: data.title.trim() || "Untitled", body: data.body, updatedBy: session.user.id }
  });
  await logActivity(session.user.id, "ldr-content-box.updated", "ContentBlockBox", boxId, { ldrSlug });
  revalidatePath(path(ldrSlug));
}

export async function deleteLdrContentBox(ldrSlug: string, boxId: string) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.contentBlockBox.delete({ where: { id: boxId } });
  await logActivity(session.user.id, "ldr-content-box.deleted", "ContentBlockBox", boxId, { ldrSlug });
  revalidatePath(path(ldrSlug));
}

export async function reorderLdrContentBoxes(ldrSlug: string, orderedIds: string[]) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.contentBlockBox.update({ where: { id }, data: { order: index } }))
  );
  await logActivity(session.user.id, "ldr-content-box.reordered", "ContentBlock", orderedIds[0] ?? "", { ldrSlug });
  revalidatePath(path(ldrSlug));
}

// ---------------------------------------------------------------------
// Announcements (scoped to this LDR)
// ---------------------------------------------------------------------

export type LdrAnnouncementInput = {
  title: string;
  body: string;
  eventAt: string | null; // datetime-local string, or null
  pinned: boolean;
};

export async function createLdrAnnouncement(ldrSlug: string, data: LdrAnnouncementInput) {
  const session = await assertLdrEdit(ldrSlug);

  const announcement = await prisma.announcement.create({
    data: {
      ldrSlug,
      title: data.title.trim() || "Untitled announcement",
      body: data.body,
      eventAt: data.eventAt ? new Date(data.eventAt) : null,
      pinned: data.pinned,
      authorId: session.user.id
    }
  });

  await logActivity(session.user.id, "ldr-announcement.created", "Announcement", announcement.id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return announcement;
}

export async function updateLdrAnnouncement(ldrSlug: string, id: string, data: LdrAnnouncementInput) {
  const session = await assertLdrEdit(ldrSlug);

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title: data.title.trim() || "Untitled announcement",
      body: data.body,
      eventAt: data.eventAt ? new Date(data.eventAt) : null,
      pinned: data.pinned
    }
  });

  await logActivity(session.user.id, "ldr-announcement.updated", "Announcement", id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return announcement;
}

export async function deleteLdrAnnouncement(ldrSlug: string, id: string) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.announcement.delete({ where: { id } });
  await logActivity(session.user.id, "ldr-announcement.deleted", "Announcement", id, { ldrSlug });
  revalidatePath(path(ldrSlug));
}

// ---------------------------------------------------------------------
// Guide links (scoped to this LDR)
// ---------------------------------------------------------------------

export type LdrGuideLinkInput = { title: string; url: string; description: string };

export async function createLdrGuideLink(ldrSlug: string, data: LdrGuideLinkInput) {
  const session = await assertLdrEdit(ldrSlug);
  const last = await prisma.guideLink.findFirst({ where: { ldrSlug }, orderBy: { order: "desc" } });

  const link = await prisma.guideLink.create({
    data: {
      ldrSlug,
      title: data.title.trim() || "Untitled link",
      url: data.url.trim(),
      description: data.description.trim() || null,
      order: (last?.order ?? -1) + 1
    }
  });

  await logActivity(session.user.id, "ldr-guide-link.created", "GuideLink", link.id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return link;
}

export async function updateLdrGuideLink(ldrSlug: string, id: string, data: LdrGuideLinkInput) {
  const session = await assertLdrEdit(ldrSlug);

  const link = await prisma.guideLink.update({
    where: { id },
    data: {
      title: data.title.trim() || "Untitled link",
      url: data.url.trim(),
      description: data.description.trim() || null
    }
  });

  await logActivity(session.user.id, "ldr-guide-link.updated", "GuideLink", id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return link;
}

export async function deleteLdrGuideLink(ldrSlug: string, id: string) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.guideLink.delete({ where: { id } });
  await logActivity(session.user.id, "ldr-guide-link.deleted", "GuideLink", id, { ldrSlug });
  revalidatePath(path(ldrSlug));
}

// ---------------------------------------------------------------------
// Reaction options (the LDR's custom-labeled buttons) + votes
// ---------------------------------------------------------------------

export async function createLdrReactionOption(ldrSlug: string, data: { emoji: string; label: string }) {
  const session = await assertLdrEdit(ldrSlug);
  const last = await prisma.reactionOption.findFirst({ where: { ldrSlug }, orderBy: { order: "desc" } });

  const option = await prisma.reactionOption.create({
    data: {
      ldrSlug,
      emoji: data.emoji.trim() || "👍",
      label: data.label.trim() || "React",
      order: (last?.order ?? -1) + 1
    }
  });

  await logActivity(session.user.id, "ldr-reaction-option.created", "ReactionOption", option.id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return option;
}

export async function updateLdrReactionOption(ldrSlug: string, id: string, data: { emoji: string; label: string }) {
  const session = await assertLdrEdit(ldrSlug);

  const option = await prisma.reactionOption.update({
    where: { id },
    data: { emoji: data.emoji.trim() || "👍", label: data.label.trim() || "React" }
  });

  await logActivity(session.user.id, "ldr-reaction-option.updated", "ReactionOption", id, { ldrSlug });
  revalidatePath(path(ldrSlug));
  return option;
}

export async function deleteLdrReactionOption(ldrSlug: string, id: string) {
  const session = await assertLdrEdit(ldrSlug);
  await prisma.reactionOption.delete({ where: { id } });
  await logActivity(session.user.id, "ldr-reaction-option.deleted", "ReactionOption", id, { ldrSlug });
  revalidatePath(path(ldrSlug));
}

/**
 * Toggles the current user's vote for one reaction option on one
 * announcement. Any signed-in, approved member can react — not just the
 * LDR's lead — since reaction bars are a unit-wide engagement feature.
 */
export async function toggleAnnouncementReaction(ldrSlug: string, announcementId: string, reactionOptionId: string) {
  const session = await requireApprovedSession();

  const existing = await prisma.reactionVote.findUnique({
    where: {
      userId_targetType_targetId_reactionOptionId: {
        userId: session.user.id,
        targetType: "Announcement",
        targetId: announcementId,
        reactionOptionId
      }
    }
  });

  if (existing) {
    await prisma.reactionVote.delete({ where: { id: existing.id } });
  } else {
    await prisma.reactionVote.create({
      data: {
        userId: session.user.id,
        targetType: "Announcement",
        targetId: announcementId,
        reactionOptionId
      }
    });
  }

  revalidatePath(path(ldrSlug));
}

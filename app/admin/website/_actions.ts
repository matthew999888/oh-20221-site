"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/announcements");
  revalidatePath("/calendar");
  revalidatePath("/gallery");
  revalidatePath("/admin/website");
}

// ---------------------------------------------------------------------
// Site-wide Announcements (ldrSlug = null)
// ---------------------------------------------------------------------

export type SiteAnnouncementInput = {
  title: string;
  body: string;
  pinned: boolean;
  publishAt: string; // datetime-local
  expiresAt: string | null;
};

export async function createSiteAnnouncement(data: SiteAnnouncementInput) {
  const session = await assertPagePermission("website-admin", "edit");

  const a = await prisma.announcement.create({
    data: {
      title: data.title.trim() || "Untitled announcement",
      body: data.body,
      pinned: data.pinned,
      publishAt: new Date(data.publishAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      authorId: session.user.id
    }
  });

  await logActivity(session.user.id, "site-announcement.created", "Announcement", a.id);
  revalidatePublicPages();
  return a;
}

export async function updateSiteAnnouncement(id: string, data: SiteAnnouncementInput) {
  const session = await assertPagePermission("website-admin", "edit");

  const a = await prisma.announcement.update({
    where: { id },
    data: {
      title: data.title.trim() || "Untitled announcement",
      body: data.body,
      pinned: data.pinned,
      publishAt: new Date(data.publishAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    }
  });

  await logActivity(session.user.id, "site-announcement.updated", "Announcement", id);
  revalidatePublicPages();
  return a;
}

export async function deleteSiteAnnouncement(id: string) {
  const session = await assertPagePermission("website-admin", "edit");
  await prisma.announcement.delete({ where: { id } });
  await logActivity(session.user.id, "site-announcement.deleted", "Announcement", id);
  revalidatePublicPages();
}

// ---------------------------------------------------------------------
// Calendar events
// ---------------------------------------------------------------------

export type CalendarEventInput = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  category: string;
};

export async function createCalendarEvent(data: CalendarEventInput) {
  const session = await assertPagePermission("website-admin", "edit");

  const event = await prisma.calendarEvent.create({
    data: {
      title: data.title.trim() || "Untitled event",
      description: data.description.trim() || null,
      location: data.location.trim() || null,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      allDay: data.allDay,
      category: data.category.trim() || null
    }
  });

  await logActivity(session.user.id, "calendar-event.created", "CalendarEvent", event.id);
  revalidatePublicPages();
  return event;
}

export async function updateCalendarEvent(id: string, data: CalendarEventInput) {
  const session = await assertPagePermission("website-admin", "edit");

  const event = await prisma.calendarEvent.update({
    where: { id },
    data: {
      title: data.title.trim() || "Untitled event",
      description: data.description.trim() || null,
      location: data.location.trim() || null,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      allDay: data.allDay,
      category: data.category.trim() || null
    }
  });

  await logActivity(session.user.id, "calendar-event.updated", "CalendarEvent", id);
  revalidatePublicPages();
  return event;
}

export async function deleteCalendarEvent(id: string) {
  const session = await assertPagePermission("website-admin", "edit");
  await prisma.calendarEvent.delete({ where: { id } });
  await logActivity(session.user.id, "calendar-event.deleted", "CalendarEvent", id);
  revalidatePublicPages();
}

// ---------------------------------------------------------------------
// Galleries + images
// ---------------------------------------------------------------------

export async function createGallery(data: { title: string; description: string }) {
  const session = await assertPagePermission("website-admin", "edit");

  const gallery = await prisma.gallery.create({
    data: { title: data.title.trim() || "Untitled gallery", description: data.description.trim() || null }
  });

  await logActivity(session.user.id, "gallery.created", "Gallery", gallery.id);
  revalidatePublicPages();
  return gallery;
}

export async function updateGallery(id: string, data: { title: string; description: string }) {
  const session = await assertPagePermission("website-admin", "edit");

  const gallery = await prisma.gallery.update({
    where: { id },
    data: { title: data.title.trim() || "Untitled gallery", description: data.description.trim() || null }
  });

  await logActivity(session.user.id, "gallery.updated", "Gallery", id);
  revalidatePublicPages();
  return gallery;
}

export async function deleteGallery(id: string) {
  const session = await assertPagePermission("website-admin", "edit");
  await prisma.gallery.delete({ where: { id } });
  await logActivity(session.user.id, "gallery.deleted", "Gallery", id);
  revalidatePublicPages();
}

export async function addGalleryImage(galleryId: string, data: { url: string; caption: string }) {
  const session = await assertPagePermission("website-admin", "edit");
  const last = await prisma.galleryImage.findFirst({ where: { galleryId }, orderBy: { order: "desc" } });

  const image = await prisma.galleryImage.create({
    data: {
      galleryId,
      url: data.url.trim(),
      caption: data.caption.trim() || null,
      order: (last?.order ?? -1) + 1
    }
  });

  // First image added becomes the cover if none is set yet.
  const gallery = await prisma.gallery.findUnique({ where: { id: galleryId } });
  if (gallery && !gallery.coverImage) {
    await prisma.gallery.update({ where: { id: galleryId }, data: { coverImage: image.url } });
  }

  await logActivity(session.user.id, "gallery-image.added", "GalleryImage", image.id, { galleryId });
  revalidatePublicPages();
  return image;
}

export async function deleteGalleryImage(galleryId: string, imageId: string) {
  const session = await assertPagePermission("website-admin", "edit");
  await prisma.galleryImage.delete({ where: { id: imageId } });
  await logActivity(session.user.id, "gallery-image.deleted", "GalleryImage", imageId, { galleryId });
  revalidatePublicPages();
}

export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import WebsiteAdminTabs from "./WebsiteAdminTabs";
import AnnouncementsEditor, { type SiteAnnouncement } from "./AnnouncementsEditor";
import CalendarEditor, { type SiteCalendarEvent } from "./CalendarEditor";
import GalleryEditor, { type SiteGallery } from "./GalleryEditor";
import {
  FaqEditor,
  HomePhotosEditor,
  InstructorsEditor,
  MessagesInbox
} from "./HomeContentEditors";

export default async function AdminWebsitePage() {
  await requirePagePermission("website-admin", "view");

  const [announcements, events, galleries, instructors, homeImages, faqs, messages] =
    await Promise.all([
      prisma.announcement.findMany({
        where: { ldrSlug: null },
        orderBy: [{ pinned: "desc" }, { publishAt: "desc" }]
      }),
      prisma.calendarEvent.findMany({ orderBy: { startsAt: "asc" } }),
      prisma.gallery.findMany({
        orderBy: { createdAt: "desc" },
        include: { images: { orderBy: { order: "asc" } } }
      }),
      prisma.instructor.findMany({ orderBy: { order: "asc" } }),
      prisma.homeImage.findMany(),
      prisma.faqItem.findMany({ orderBy: { order: "asc" } }),
      // Unhandled first, newest first within each group.
      prisma.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }] })
    ]);

  const siteAnnouncements: SiteAnnouncement[] = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    pinned: a.pinned,
    publishAt: a.publishAt.toISOString(),
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null
  }));

  const siteEvents: SiteCalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    allDay: e.allDay,
    category: e.category
  }));

  const siteGalleries: SiteGallery[] = galleries.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    coverImage: g.coverImage,
    images: g.images.map((img) => ({ id: img.id, url: img.url, caption: img.caption }))
  }));

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Website Content</h1>
      <p className="dash-page__subtitle">
        Manage the unit-wide Announcements, Calendar, and Gallery that feed the public site — changes publish
        immediately.
      </p>

      <WebsiteAdminTabs
        announcements={<AnnouncementsEditor initial={siteAnnouncements} />}
        calendar={<CalendarEditor initial={siteEvents} />}
        gallery={<GalleryEditor initial={siteGalleries} />}
        instructors={
          <InstructorsEditor
            initial={instructors.map((i) => ({
              id: i.id,
              name: i.name,
              title: i.title,
              bio: i.bio,
              photoUrl: i.photoUrl,
              order: i.order
            }))}
          />
        }
        photos={
          <HomePhotosEditor
            initial={homeImages.map((i) => ({
              slot: i.slot,
              url: i.url,
              alt: i.alt,
              caption: i.caption
            }))}
          />
        }
        faq={
          <FaqEditor
            initial={faqs.map((f) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              order: f.order
            }))}
          />
        }
        messages={
          <MessagesInbox
            initial={messages.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              subject: m.subject,
              message: m.message,
              handled: m.handled,
              createdAt: m.createdAt.toISOString()
            }))}
          />
        }
        unreadCount={messages.filter((m) => !m.handled).length}
      />
    </div>
  );
}

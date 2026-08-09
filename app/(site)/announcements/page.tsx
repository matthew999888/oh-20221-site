export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PageHeader from "../PageHeader";

export const metadata: Metadata = {
  title: "Announcements",
  description: "Unit-wide notices and updates from OH-20221 AFJROTC."
};

export default async function AnnouncementsPage() {
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    // `ldrSlug: null` = site-wide. Without this filter, announcements
    // scoped to a single LDR team page leak onto the public feed.
    where: {
      ldrSlug: null,
      publishAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
    },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }]
  });

  return (
    <>
      <PageHeader
        eyebrow="Unit News"
        title="Announcements"
        lede="Unit-wide notices and updates from OH-20221."
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          {announcements.length === 0 ? (
            <p className="pub-empty">No announcements right now — check back soon.</p>
          ) : (
            <div className="pub-grid">
              {announcements.map((a) => (
                <article className="pub-card" key={a.id}>
                  {a.pinned && (
                    <span className="pub-tag pub-tag--pinned">
                      <i className="fa-solid fa-thumbtack" aria-hidden="true" />
                      Pinned
                    </span>
                  )}
                  <h2 className="pub-card__title">{a.title}</h2>
                  <p className="pub-card__meta" style={{ marginTop: 0 }}>
                    <time dateTime={a.publishAt.toISOString()}>
                      {a.publishAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </time>
                  </p>
                  <div className="pub-card__body">
                    {a.body
                      .split("\n")
                      .filter((line) => line.trim() !== "")
                      .map((line, idx) => (
                        <p key={idx} style={{ marginBottom: "0.65rem" }}>
                          {line}
                        </p>
                      ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

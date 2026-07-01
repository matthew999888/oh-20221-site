export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    where: { publishAt: { lte: new Date() }, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }]
  });

  return (
    <main className="page-section">
      <h1 className="page-section__title">Announcements</h1>
      <p className="page-section__sub">Unit-wide notices and updates from OH-20221.</p>

      {announcements.length === 0 ? (
        <p className="content-block__empty">No announcements right now — check back soon.</p>
      ) : (
        <div className="announcement-list">
          {announcements.map((a) => (
            <article className="announcement-card" key={a.id}>
              {a.pinned && <span className="info-card__pin">Pinned</span>}
              <h2>{a.title}</h2>
              <time className="info-card__date">
                {a.publishAt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </time>
              <div className="announcement-card__body">
                {a.body.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

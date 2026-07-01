export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";

export default async function HomePage() {
  const [announcements, events, galleries] = await Promise.all([
    prisma.announcement.findMany({
      where: { publishAt: { lte: new Date() }, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 3
    }),
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3
    }),
    prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { images: { orderBy: { order: "asc" }, take: 1 } }
    })
  ]);

  return (
    <main>
      <section className="hero">
        <div className="badge-ring badge-ring--lg" aria-hidden="true" />
        <h1 className="hero__title">OH-20221 Air Force Junior ROTC</h1>
        <p className="hero__sub">Logan High School &middot; Logan, Ohio</p>
        <p className="hero__tagline">
          Building citizens of character dedicated to serving their nation and community.
        </p>
        <div className="hero__actions">
          <Link href="/announcements" className="btn-primary">
            Latest Announcements
          </Link>
          <Link href="/calendar" className="btn-ghost">
            View Calendar
          </Link>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2>Announcements</h2>
          <Link href="/announcements">View all &rarr;</Link>
        </div>
        {announcements.length === 0 ? (
          <p className="content-block__empty">No announcements right now — check back soon.</p>
        ) : (
          <div className="card-grid">
            {announcements.map((a) => (
              <article className="info-card" key={a.id}>
                {a.pinned && <span className="info-card__pin">Pinned</span>}
                <h3>{a.title}</h3>
                <p>{a.body.length > 160 ? a.body.slice(0, 160) + "…" : a.body}</p>
                <time className="info-card__date">
                  {a.publishAt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2>Upcoming Events</h2>
          <Link href="/calendar">Full calendar &rarr;</Link>
        </div>
        {events.length === 0 ? (
          <p className="content-block__empty">No upcoming events scheduled.</p>
        ) : (
          <div className="card-grid">
            {events.map((e) => (
              <article className="info-card" key={e.id}>
                <span className="info-card__pin info-card__pin--event">{e.category ?? "Event"}</span>
                <h3>{e.title}</h3>
                {e.location && <p className="info-card__meta"><i className="fa-solid fa-location-dot" /> {e.location}</p>}
                <time className="info-card__date">
                  {e.startsAt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  {!e.allDay &&
                    " · " +
                      e.startsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </time>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2>Gallery</h2>
          <Link href="/gallery">View all &rarr;</Link>
        </div>
        {galleries.length === 0 ? (
          <p className="content-block__empty">No galleries published yet.</p>
        ) : (
          <div className="gallery-teaser-grid">
            {galleries.map((g) => (
              <Link href={`/gallery/${g.id}`} key={g.id} className="gallery-teaser">
                {g.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={toDriveThumbnail(g.images[0].url, 400)} alt="" loading="lazy" />
                ) : (
                  <div className="gallery-teaser__placeholder" />
                )}
                <span className="gallery-teaser__title">{g.title}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

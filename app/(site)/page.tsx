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
      <section className="hh-hero">
        <div className="hh-hero-bg" aria-hidden="true">
          <div className="hh-hero-grid" />
          <div className="hh-hero-orb1" />
          <div className="hh-hero-orb2" />
          <div className="hh-hero-ov" />
        </div>

        <div className="hh-hero-content">
          <div className="hh-hero-text">
            <div className="hh-hero-eyebrow">Air Force Junior ROTC &nbsp;&middot;&nbsp; Logan, Ohio</div>

            <h1 className="hh-hero-h1">
              Building
              <br />
              <em>Better</em>
              <br />
              Citizens
            </h1>

            <div className="hh-hero-mottos">
              <div className="hh-hero-motto">
                <i className="fa-solid fa-chevron-right" aria-hidden="true" /> Building Better Citizens
              </div>
              <div className="hh-hero-motto">
                <i className="fa-solid fa-chevron-right" aria-hidden="true" /> Leadership in Action
              </div>
            </div>

            <div className="hh-hero-cta">
              <div className="cta-row">
                <Link href="/announcements" className="btn-primary">
                  Latest Announcements
                </Link>
                <Link href="/login" className="btn-ghost">
                  <i className="fa-solid fa-arrow-right-to-bracket" aria-hidden="true" /> Cadet Login
                </Link>
              </div>
            </div>
          </div>

          <div className="hh-hero-badge-wrap" aria-hidden="true">
            <div className="hh-hero-badge-ring">
              <i className="fa-solid fa-shield-halved" />
            </div>
          </div>
        </div>
      </section>

      <div className="hh-marquee-wrap" aria-hidden="true">
        <div className="hh-marquee-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              <span className="hh-marquee-item">
                <strong>OH-20221</strong>
                <span className="hh-dot">&#10022;</span>Building Better Citizens
                <span className="hh-dot">&#10022;</span>
              </span>
              <span className="hh-marquee-item">
                <strong>AFJROTC</strong>
                <span className="hh-dot">&#10022;</span>Leadership in Action
                <span className="hh-dot">&#10022;</span>
              </span>
              <span className="hh-marquee-item">
                <strong>Logan High School</strong>
                <span className="hh-dot">&#10022;</span>Logan, Ohio
                <span className="hh-dot">&#10022;</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="hh-stats-section" aria-label="Unit statistics">
        <div className="hh-stats-grid">
          <div className="hh-stat-block">
            <div className="hh-stat-n">
              20<span>+</span>
            </div>
            <div className="hh-stat-label">Years Active</div>
          </div>
          <div className="hh-stat-block">
            <div className="hh-stat-n">
              85<span>+</span>
            </div>
            <div className="hh-stat-label">Cadets Enrolled</div>
          </div>
          <div className="hh-stat-block">
            <div className="hh-stat-n">6</div>
            <div className="hh-stat-label">Special Teams</div>
          </div>
          <div className="hh-stat-block">
            <div className="hh-stat-n">
              40<span>+</span>
            </div>
            <div className="hh-stat-label">Leadership Positions</div>
          </div>
        </div>
      </div>

      <section className="hh-pillars-section" aria-labelledby="pillars-heading">
        <div className="hh-pillars-head">
          <div className="hh-pillars-eyebrow">About AFJROTC</div>
          <h2 className="hh-pillars-title" id="pillars-heading">
            More Than A<br />
            <em>Program</em>
          </h2>
          <p className="hh-pillars-sub">
            AFJROTC develops citizens of character dedicated to serving their nation and community. OH-20221
            has been shaping leaders at Logan High School for over two decades.
          </p>
        </div>

        <div className="hh-pillars-grid">
          <div className="hh-pillar-card">
            <div className="hh-pillar-icon" aria-hidden="true">
              <i className="fa-solid fa-star" />
            </div>
            <div className="hh-pillar-title">Leadership</div>
            <p className="hh-pillar-body">
              Cadets take on real command responsibilities from day one. Through a structured rank system and
              officer positions, every cadet learns to lead, delegate, and inspire those around them.
            </p>
          </div>
          <div className="hh-pillar-card">
            <div className="hh-pillar-icon" aria-hidden="true">
              <i className="fa-solid fa-hands-holding-circle" />
            </div>
            <div className="hh-pillar-title">Service</div>
            <p className="hh-pillar-body">
              OH-20221 cadets complete hundreds of community service hours annually — from local parades and
              memorial ceremonies to food drives and school events across Hocking County.
            </p>
          </div>
          <div className="hh-pillar-card">
            <div className="hh-pillar-icon" aria-hidden="true">
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div className="hh-pillar-title">Discipline</div>
            <p className="hh-pillar-body">
              From drill formations to uniform inspections, our program instills the personal discipline and
              attention to detail that follows cadets into college, careers, and every aspect of adult life.
            </p>
          </div>
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

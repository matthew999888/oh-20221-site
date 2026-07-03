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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/badge.png" alt="" className="hh-hero-badge-img" />
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
              5<span>+</span>
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
            <div className="hh-stat-n">13</div>
            <div className="hh-stat-label">LDRs</div>
          </div>
          <div className="hh-stat-block">
            <div className="hh-stat-n">
              <i className="fa-solid fa-award" aria-hidden="true" />
            </div>
            <div className="hh-stat-label">Distinguished Unit w/ Merit</div>
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
            has been shaping leaders at Logan High School since day one.
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

      <section className="hh-cmd-section" aria-labelledby="cmd-heading">
        <div className="hh-cmd-inner">
          <div className="hh-cmd-head">
            <div className="hh-pillars-eyebrow">SY 2025–2026</div>
            <h2 className="hh-pillars-title" id="cmd-heading">
              Chain of<br />
              <em>Command</em>
            </h2>
            <p className="hh-pillars-sub">
              The organizational structure of OH-20221. All cadet positions are appointed annually based on
              merit, performance, and leadership potential.
            </p>
          </div>

          <div className="hh-cmd-tree">
            <div className="hh-cmd-row">
              <div className="hh-cmd-card hh-cmd-card--top">
                <div className="hh-cmd-rank">SASI &middot; Faculty</div>
                <div className="hh-cmd-name">Maj Lance Roberts</div>
                <div className="hh-cmd-title">Senior Aerospace Science Instructor</div>
              </div>
              <div className="hh-cmd-card hh-cmd-card--top">
                <div className="hh-cmd-rank">ASI &middot; Faculty</div>
                <div className="hh-cmd-name">MSgt Jeffery George</div>
                <div className="hh-cmd-title">Aerospace Science Instructor</div>
              </div>
            </div>
            <div className="hh-cmd-row">
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">Corps HQ</div>
                <div className="hh-cmd-name">C/Col Kevin Easton</div>
                <div className="hh-cmd-title">Corps Commander</div>
              </div>
            </div>
            <div className="hh-cmd-row">
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">C/Lt Col</div>
                <div className="hh-cmd-name">Liam Triest</div>
                <div className="hh-cmd-title">Vice Corps Commander</div>
              </div>
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">C/Major</div>
                <div className="hh-cmd-name">Tifani Stevens</div>
                <div className="hh-cmd-title">Executive Officer</div>
              </div>
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">Command Staff</div>
                <div className="hh-cmd-name">Cook &amp; Messer</div>
                <div className="hh-cmd-title">Superintendent &middot; 1st Sgt</div>
              </div>
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">IG &amp; Stan Eval</div>
                <div className="hh-cmd-name">Sowers &amp; Lehman</div>
                <div className="hh-cmd-title">C/Major &middot; C/Captain</div>
              </div>
            </div>
            <div className="hh-cmd-row">
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">C/Major</div>
                <div className="hh-cmd-name">Clayton Rice</div>
                <div className="hh-cmd-title">Director of Operations</div>
              </div>
              <div className="hh-cmd-card">
                <div className="hh-cmd-rank">C/Major</div>
                <div className="hh-cmd-name">Nathaniel Frost</div>
                <div className="hh-cmd-title">Director of Mission Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="hh-instructors-section" aria-labelledby="instructors-heading">
        <div className="hh-instructors-inner">
          <div className="hh-instructors-head">
            <div className="hh-pillars-eyebrow">Unit Leadership</div>
            <h2 className="hh-pillars-title" id="instructors-heading">
              Meet Our<br />
              <em>Instructors</em>
            </h2>
          </div>

          <div className="hh-instructors-grid">
            <div className="hh-instructor-card">
              <div className="hh-instructor-top">
                <div className="hh-instructor-avatar" aria-hidden="true">
                  LR
                </div>
                <div>
                  <div className="hh-instructor-name">Major Lance Roberts</div>
                  <div className="hh-instructor-role">SASI — OH-20221 AFJROTC</div>
                </div>
              </div>
              <p className="hh-instructor-bio">
                Major Roberts brings years of active-duty Air Force service and leadership experience to Logan
                High School&rsquo;s AFJROTC program. His mission is to develop disciplined, service-oriented
                leaders who carry the values of integrity, service, and excellence beyond graduation and into
                every facet of their lives.
              </p>
            </div>
            <div className="hh-instructor-card">
              <div className="hh-instructor-top">
                <div className="hh-instructor-avatar" aria-hidden="true">
                  JG
                </div>
                <div>
                  <div className="hh-instructor-name">MSgt Jeffery George</div>
                  <div className="hh-instructor-role">ASI — OH-20221 AFJROTC</div>
                </div>
              </div>
              <p className="hh-instructor-bio">
                MSgt George&rsquo;s decorated Air Force career shaped his approach to mentoring: every cadet
                gets real attention, real feedback, and real opportunities to grow. He oversees physical
                training, drill operations, and the day-to-day readiness of the corps.
              </p>
            </div>
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
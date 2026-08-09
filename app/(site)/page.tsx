export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";
import HeroVideo from "./HeroVideo";

export const metadata: Metadata = {
  title: "Home",
  description:
    "OH-20221 Air Force Junior ROTC at Logan High School — building better citizens through leadership, service, and discipline."
};

// No icons. A decorative glyph in a tinted rounded box adds nothing the
// heading doesn't already say, and is one of the clearest tells of a
// generated layout. The numeral carries the same visual anchor.
const PILLARS = [
  {
    title: "Leadership",
    body: "Cadets take on real command responsibilities from day one. Through a structured rank system and officer positions, every cadet learns to lead, delegate, and inspire those around them."
  },
  {
    title: "Service",
    body: "OH-20221 cadets complete hundreds of community service hours annually — from local parades and memorial ceremonies to food drives and school events across Hocking County."
  },
  {
    title: "Discipline",
    body: "From drill formations to uniform inspections, our program instills the personal discipline and attention to detail that follows cadets into college, careers, and every aspect of adult life."
  }
];

const CHAIN = [
  {
    label: "Instructor Staff",
    people: [
      { rank: "SASI", name: "Maj Lance Roberts", role: "Senior Aerospace Science Instructor", command: true },
      { rank: "ASI", name: "MSgt Jeffery George", role: "Aerospace Science Instructor", command: true }
    ]
  },
  {
    label: "Corps Headquarters",
    people: [{ rank: "C/Col", name: "Kevin Easton", role: "Corps Commander", command: true }]
  },
  {
    label: "Command Staff",
    people: [
      { rank: "C/Lt Col", name: "Liam Triest", role: "Vice Corps Commander", command: false },
      { rank: "C/Maj", name: "Tifani Stevens", role: "Executive Officer", command: false },
      { rank: "Command Staff", name: "Cook & Messer", role: "Superintendent · First Sergeant", command: false },
      { rank: "IG & Stan Eval", name: "Sowers & Lehman", role: "C/Major · C/Captain", command: false }
    ]
  },
  {
    label: "Directorates",
    people: [
      { rank: "C/Maj", name: "Clayton Rice", role: "Director of Operations", command: false },
      { rank: "C/Maj", name: "Nathaniel Frost", role: "Director of Mission Support", command: false }
    ]
  }
];

const INSTRUCTORS = [
  {
    initials: "LR",
    name: "Major Lance Roberts",
    role: "SASI — OH-20221",
    bio: "Major Roberts brings years of active-duty Air Force service and leadership experience to Logan High School's AFJROTC program. His mission is to develop disciplined, service-oriented leaders who carry the values of integrity, service, and excellence beyond graduation and into every facet of their lives."
  },
  {
    initials: "JG",
    name: "MSgt Jeffery George",
    role: "ASI — OH-20221",
    bio: "MSgt George's decorated Air Force career shaped his approach to mentoring: every cadet gets real attention, real feedback, and real opportunities to grow. He oversees physical training, drill operations, and the day-to-day readiness of the corps."
  }
];

export default async function HomePage() {
  const now = new Date();
  const [announcements, events, galleries] = await Promise.all([
    prisma.announcement.findMany({
      where: {
        ldrSlug: null,
        publishAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }]
      },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 3
    }),
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      take: 3
    }),
    prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { images: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { images: true } } }
    })
  ]);

  return (
    <>
      <section className="pub-hero" aria-labelledby="hero-heading">
        <HeroVideo />

        <div className="pub-hero__inner">
          {/* One bordered panel over the footage, left-weighted. The
              scrim behind it is what guarantees contrast once real
              video is dropped in. */}
          <div className="pub-hero__panel">
            <span className="pub-eyebrow">Air Force Junior ROTC &middot; Unit OH-20221</span>
            <h1 className="pub-hero__title" id="hero-heading">
              Building <em>better</em> citizens, one cadet at a time.
            </h1>
            <p className="pub-hero__lede">
              A leadership and citizenship program at Logan High School, developing character,
              discipline, and a habit of service since 2020.
            </p>
            <div className="pub-hero__actions">
              <Link href="/announcements" className="pub-btn pub-btn--primary">
                Latest announcements
              </Link>
              <Link href="/login" className="pub-btn pub-btn--ghost">
                Cadet login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pub-stats" aria-label="Unit at a glance">
        <div className="pub-stats__grid">
          <div className="pub-stat">
            <p className="pub-stat__n">
              5<span aria-hidden="true">+</span>
            </p>
            <p className="pub-stat__label">Years Active</p>
          </div>
          <div className="pub-stat">
            <p className="pub-stat__n">
              85<span aria-hidden="true">+</span>
            </p>
            <p className="pub-stat__label">Cadets Enrolled</p>
          </div>
          <div className="pub-stat">
            <p className="pub-stat__n">13</p>
            <p className="pub-stat__label">Leadership Development Requirements</p>
          </div>
          <div className="pub-stat">
            {/* Was an award icon. A word carries more than a glyph and
                keeps the row typographically consistent. */}
            <p className="pub-stat__n">DUwM</p>
            <p className="pub-stat__label">Distinguished Unit with Merit</p>
          </div>
        </div>
      </section>

      <section className="pub-section" aria-labelledby="pillars-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">01</span>About the program
            </p>
            <div>
              <h2 className="pub-h2" id="pillars-heading">
                More than a class on a schedule.
              </h2>
              <p className="pub-lede">
                AFJROTC develops citizens of character dedicated to serving their nation and
                community. OH-20221 has been shaping leaders at Logan High School since day one.
              </p>
            </div>
          </div>

          <div className="pub-grid">
            {PILLARS.map((p, i) => (
              <article className="pub-card" key={p.title}>
                <span className="pub-card__index">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="pub-card__title">{p.title}</h3>
                <p className="pub-card__body">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--rule" aria-labelledby="chain-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">02</span>School year 2025&ndash;26
            </p>
            <div>
              <h2 className="pub-h2" id="chain-heading">
                Chain of command.
              </h2>
              <p className="pub-lede">
                All cadet positions are appointed annually on merit, performance, and leadership
                potential.
              </p>
            </div>
          </div>

          {/* A roster reads as a list, not as a grid of boxes — each tier
              is a labelled row separated by a rule. */}
          <div className="pub-chain">
            {CHAIN.map((tier) => (
              <div className="pub-chain__tier" key={tier.label}>
                <h3 className="pub-chain__label">{tier.label}</h3>
                <div className="pub-chain__people">
                  {tier.people.map((person) => (
                    <div key={person.name}>
                      <p className="pub-person__rank">{person.rank}</p>
                      <p className="pub-person__name">{person.name}</p>
                      <p className="pub-person__role">{person.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--rule" aria-labelledby="instructors-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">03</span>Unit leadership
            </p>
            <div>
              <h2 className="pub-h2" id="instructors-heading">
                The instructors.
              </h2>
            </div>
          </div>

          <div className="pub-grid pub-grid--2">
            {INSTRUCTORS.map((i) => (
              <article className="pub-instructor" key={i.name}>
                <div>
                  <h3 className="pub-instructor__name">{i.name}</h3>
                  <p className="pub-instructor__role">{i.role}</p>
                </div>
                <p className="pub-instructor__bio">{i.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--rule" aria-labelledby="announcements-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">04</span>Unit news
            </p>
            <div className="pub-sectionhead__aside">
              <h2 className="pub-h2" id="announcements-heading">
                Announcements.
              </h2>
              <Link href="/announcements" className="pub-viewall">
                View all &rarr;
              </Link>
            </div>
          </div>

          {announcements.length === 0 ? (
            <p className="pub-empty">No announcements right now — check back soon.</p>
          ) : (
            <div className="pub-grid">
              {announcements.map((a) => (
                <article className="pub-card" key={a.id}>
                  {a.pinned && <span className="pub-tag pub-tag--pinned">Pinned</span>}
                  <h3 className="pub-card__title">{a.title}</h3>
                  <p className="pub-card__body">
                    {a.body.length > 170 ? `${a.body.slice(0, 170).trimEnd()}…` : a.body}
                  </p>
                  <p className="pub-card__meta">
                    <time dateTime={a.publishAt.toISOString()}>
                      {a.publishAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </time>
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pub-section pub-section--rule" aria-labelledby="events-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">05</span>What&rsquo;s next
            </p>
            <div className="pub-sectionhead__aside">
              <h2 className="pub-h2" id="events-heading">
                Upcoming events.
              </h2>
              <Link href="/calendar" className="pub-viewall">
                Full calendar &rarr;
              </Link>
            </div>
          </div>

          {events.length === 0 ? (
            <p className="pub-empty">No upcoming events scheduled.</p>
          ) : (
            <div className="pub-grid">
              {events.map((e) => (
                <article className="pub-card" key={e.id}>
                  <span className="pub-tag pub-tag--event">{e.category ?? "Event"}</span>
                  <h3 className="pub-card__title">{e.title}</h3>
                  {e.location && (
                    <p className="pub-card__body">
                      <span className="sr-only">Location: </span>
                      {e.location}
                    </p>
                  )}
                  <p className="pub-card__meta">
                    <time dateTime={e.startsAt.toISOString()}>
                      {e.startsAt.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric"
                      })}
                      {!e.allDay &&
                        ` · ${e.startsAt.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit"
                        })}`}
                    </time>
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pub-section pub-section--rule" aria-labelledby="gallery-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">06</span>In pictures
            </p>
            <div className="pub-sectionhead__aside">
              <h2 className="pub-h2" id="gallery-heading">
                From the field.
              </h2>
              <Link href="/gallery" className="pub-viewall">
                View all albums &rarr;
              </Link>
            </div>
          </div>

          {galleries.length === 0 ? (
            <p className="pub-empty">No galleries published yet.</p>
          ) : (
            <div className="pub-gallery-grid">
              {galleries.map((g) => (
                <Link href={`/gallery/${g.id}`} key={g.id} className="pub-gallery-card">
                  {g.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={toDriveThumbnail(g.images[0].url, 500)} alt="" loading="lazy" />
                  ) : (
                    <span className="pub-gallery-card__placeholder" />
                  )}
                  <span className="pub-gallery-card__label">
                    {g.title}
                    <span className="pub-gallery-card__count">
                      {g._count.images} {g._count.images === 1 ? "photo" : "photos"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

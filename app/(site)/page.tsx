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

const PILLARS = [
  {
    icon: "fa-star",
    title: "Leadership",
    body: "Cadets take on real command responsibilities from day one. Through a structured rank system and officer positions, every cadet learns to lead, delegate, and inspire those around them."
  },
  {
    icon: "fa-hands-holding-circle",
    title: "Service",
    body: "OH-20221 cadets complete hundreds of community service hours annually — from local parades and memorial ceremonies to food drives and school events across Hocking County."
  },
  {
    icon: "fa-shield-halved",
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
          <p className="pub-hero__eyebrow">Air Force Junior ROTC · Logan, Ohio</p>
          <h1 className="pub-hero__title" id="hero-heading">
            Building <em>Better</em> Citizens
          </h1>
          <hr className="pub-hero__rule" />
          <p className="pub-hero__lede">
            Unit OH-20221 develops leadership, character, and a sense of service at Logan High
            School — one cadet at a time.
          </p>
          <div className="pub-hero__actions">
            <Link href="/announcements" className="pub-btn pub-btn--primary">
              Latest Announcements
            </Link>
            <Link href="/login" className="pub-btn pub-btn--ghost">
              <i className="fa-solid fa-arrow-right-to-bracket" aria-hidden="true" />
              Cadet Login
            </Link>
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
            <p className="pub-stat__n">
              <i className="fa-solid fa-award" aria-hidden="true" />
            </p>
            <p className="pub-stat__label">Distinguished Unit with Merit</p>
          </div>
        </div>
      </section>

      <section className="pub-section" aria-labelledby="pillars-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead pub-sectionhead--center">
            <p className="pub-eyebrow">About AFJROTC</p>
            <h2 className="pub-h2" id="pillars-heading">
              More Than a <em>Program</em>
            </h2>
            <p className="pub-lede">
              AFJROTC develops citizens of character dedicated to serving their nation and
              community. OH-20221 has been shaping leaders at Logan High School since day one.
            </p>
          </div>

          <div className="pub-grid">
            {PILLARS.map((p) => (
              <article className="pub-card pub-pillar" key={p.title}>
                <span className="pub-card__icon" aria-hidden="true">
                  <i className={`fa-solid ${p.icon}`} />
                </span>
                <h3 className="pub-pillar__title">{p.title}</h3>
                <p className="pub-card__body">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--alt" aria-labelledby="chain-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-eyebrow">School Year 2025–2026</p>
            <h2 className="pub-h2" id="chain-heading">
              Chain of <em>Command</em>
            </h2>
            <p className="pub-lede">
              The organizational structure of OH-20221. All cadet positions are appointed annually
              based on merit, performance, and leadership potential.
            </p>
          </div>

          <div className="pub-chain">
            {CHAIN.map((tier) => (
              <div key={tier.label}>
                <h3 className="pub-chain__label">{tier.label}</h3>
                <div className="pub-chain__tier">
                  {tier.people.map((person) => (
                    <div
                      className={`pub-person ${person.command ? "pub-person--command" : ""}`}
                      key={person.name}
                    >
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

      <section className="pub-section" aria-labelledby="instructors-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-eyebrow">Unit Leadership</p>
            <h2 className="pub-h2" id="instructors-heading">
              Meet Our <em>Instructors</em>
            </h2>
          </div>

          <div className="pub-grid pub-grid--2">
            {INSTRUCTORS.map((i) => (
              <article className="pub-instructor" key={i.name}>
                <div className="pub-instructor__top">
                  <span className="pub-instructor__avatar" aria-hidden="true">
                    {i.initials}
                  </span>
                  <div>
                    <h3 className="pub-instructor__name">{i.name}</h3>
                    <p className="pub-instructor__role">{i.role}</p>
                  </div>
                </div>
                <p className="pub-instructor__bio">{i.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pub-section pub-section--alt" aria-labelledby="announcements-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead pub-sectionhead--row">
            <div>
              <p className="pub-eyebrow">Unit News</p>
              <h2 className="pub-h2" id="announcements-heading">
                Announcements
              </h2>
            </div>
            <Link href="/announcements" className="pub-viewall">
              View all announcements
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>

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

      <section className="pub-section" aria-labelledby="events-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead pub-sectionhead--row">
            <div>
              <p className="pub-eyebrow">What&rsquo;s Next</p>
              <h2 className="pub-h2" id="events-heading">
                Upcoming Events
              </h2>
            </div>
            <Link href="/calendar" className="pub-viewall">
              Full calendar
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          {events.length === 0 ? (
            <p className="pub-empty">No upcoming events scheduled.</p>
          ) : (
            <div className="pub-grid">
              {events.map((e) => (
                <article className="pub-card" key={e.id}>
                  <span className="pub-tag pub-tag--event">
                    <i className="fa-solid fa-calendar-day" aria-hidden="true" />
                    {e.category ?? "Event"}
                  </span>
                  <h3 className="pub-card__title">{e.title}</h3>
                  {e.location && (
                    <p className="pub-card__body">
                      <i className="fa-solid fa-location-dot" aria-hidden="true" />{" "}
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

      <section className="pub-section pub-section--alt" aria-labelledby="gallery-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead pub-sectionhead--row">
            <div>
              <p className="pub-eyebrow">In Pictures</p>
              <h2 className="pub-h2" id="gallery-heading">
                Gallery
              </h2>
            </div>
            <Link href="/gallery" className="pub-viewall">
              View all albums
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </Link>
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

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { toDriveThumbnail } from "@/lib/google-drive";
import { CONTACTS, UNIT } from "@/lib/legal";
import HeroVideo from "./HeroVideo";
import ContactForm from "./ContactForm";
import HomeFigure from "./HomeFigure";

export const metadata: Metadata = {
  title: "Home",
  description:
    "OH-20221 Air Force Junior ROTC at Logan High School — developing citizens of character dedicated to serving their nation and community."
};

/** The official AFJROTC mission. Not editable: it is not ours to edit. */
const MISSION = "Develop citizens of character dedicated to serving their nation and community.";

const PILLARS = [
  {
    title: "Leadership",
    body: "Cadets take on real command responsibilities from day one. Through a structured rank system and officer positions, every cadet learns to lead, delegate, and inspire those around them."
  },
  {
    title: "Service",
    body: "Cadets serve across Hocking County — local parades and memorial ceremonies, food drives, and school events — and log every hour toward their own record of service."
  },
  {
    title: "Discipline",
    body: "From drill formations to uniform inspections, the program builds the personal discipline and attention to detail that follows cadets into college, careers, and adult life."
  }
];

/* Tiers of responsibility, NOT a reporting tree.
   The earlier version drew connector lines implying who reports to
   whom — those lines were invented here, not supplied by the unit.
   Listing tiers states what is actually known: the positions held, and
   roughly at what level. */
const ROSTER: { tier: string; people: { rank: string; name: string; role: string }[] }[] = [
  {
    tier: "Instructor staff",
    people: [
      {
        rank: "SASI",
        name: "Maj Lance Roberts",
        role: "Senior Aerospace Science Instructor"
      },
      { rank: "ASI", name: "MSgt Jeffery George", role: "Aerospace Science Instructor" }
    ]
  },
  {
    tier: "Corps headquarters",
    people: [
      { rank: "C/Col", name: "Kevin Easton", role: "Corps Commander" },
      { rank: "C/Lt Col", name: "Liam Triest", role: "Vice Corps Commander" },
      { rank: "C/Maj", name: "Tifani Stevens", role: "Executive Officer" }
    ]
  },
  {
    tier: "Command staff",
    people: [
      { rank: "Superintendent", name: "Cook", role: "Corps Superintendent" },
      { rank: "First Sergeant", name: "Messer", role: "Corps First Sergeant" },
      { rank: "C/Maj", name: "Sowers", role: "Inspector General" },
      { rank: "C/Capt", name: "Lehman", role: "Standardization & Evaluation" }
    ]
  },
  {
    tier: "Directorates",
    people: [
      { rank: "C/Maj", name: "Clayton Rice", role: "Director of Operations" },
      { rank: "C/Maj", name: "Nathaniel Frost", role: "Director of Mission Support" }
    ]
  }
];

export default async function HomePage() {
  const [instructors, images, faqs] = await Promise.all([
    prisma.instructor.findMany({ orderBy: { order: "asc" } }),
    prisma.homeImage.findMany(),
    prisma.faqItem.findMany({ orderBy: { order: "asc" } })
  ]);

  const imageBySlot = new Map(images.map((i) => [i.slot, i]));
  const corpsPhoto = imageBySlot.get("corps");

  return (
    <>
      <section className="pub-hero" aria-labelledby="hero-heading">
        <HeroVideo />

        <div className="pub-hero__inner">
          {/* Copy sits directly on the footage, anchored into the
              bottom-left corner where the scrim is densest. */}
          <div className="pub-hero__content">
            <span className="pub-eyebrow">Air Force Junior ROTC &middot; Unit OH-20221</span>
            <h1 className="pub-hero__title" id="hero-heading">
              Building <em>better citizens</em> at Logan High School.
            </h1>
            <p className="pub-hero__lede">
              A leadership and citizenship program open to every Logan High School student — no
              military obligation, no prior experience required.
            </p>
            <div className="pub-hero__actions">
              <a href="#about" className="pub-btn pub-btn--primary">
                About the program
              </a>
              <a href="#contact" className="pub-btn pub-btn--ghost">
                Get in touch
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────────────── */}
      <section className="pub-wrap" aria-labelledby="mission-heading">
        <div className="pub-mission">
          <p className="pub-sectionhead__label" id="mission-heading">
            <span className="pub-num">01</span>Mission
          </p>
          <div>
            <p className="pub-mission__text">{MISSION}</p>
            <p className="pub-mission__source">
              The mission of Air Force Junior ROTC, U.S. Air Force
            </p>
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────────────── */}
      <section className="pub-section pub-section--rule" id="about" aria-labelledby="about-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">02</span>About the program
            </p>
            <div>
              <h2 className="pub-h2" id="about-heading">
                More than a class on a schedule.
              </h2>
              <p className="pub-lede">
                AFJROTC is a citizenship program, not a recruiting program. Cadets study aerospace
                science and leadership, take on real responsibility inside the corps, and serve
                their community.
              </p>
            </div>
          </div>

          <div className="pub-split" style={{ marginBottom: "3rem" }}>
            <HomeFigure image={imageBySlot.get("about")} slot="about" label="About section photo" />
            <HomeFigure
              image={imageBySlot.get("service")}
              slot="service"
              label="Service photo"
            />
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

      {/* ── Chain of command ────────────────────────────────────────── */}
      <section className="pub-section pub-section--rule" aria-labelledby="chain-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">03</span>School year 2025&ndash;26
            </p>
            <div>
              <h2 className="pub-h2" id="chain-heading">
                Command staff.
              </h2>
              <p className="pub-lede">
                Cadet positions are appointed annually on merit, performance, and leadership
                potential.
              </p>
            </div>
          </div>

          <div className="pub-roster">
            {ROSTER.map((tier) => (
              <div className="pub-roster__tier" key={tier.tier}>
                <h3 className="pub-roster__label">{tier.tier}</h3>
                <div className="pub-roster__people">
                  {tier.people.map((p) => (
                    <div key={p.name + p.role}>
                      <p className="pub-person__rank">{p.rank}</p>
                      <p className="pub-person__name">{p.name}</p>
                      <p className="pub-person__role">{p.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Corps photo ───────────────────────────────────────────────
          Editable via the "corps" HomeImage slot; falls back to the
          committed file so the section is never empty. Rendered
          uncropped — cropping a group photo cuts people out of it. */}
      <section className="pub-band" aria-labelledby="corps-photo-heading">
        <h2 className="sr-only" id="corps-photo-heading">
          The corps
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pub-band__img"
          src={
            corpsPhoto ? toDriveThumbnail(corpsPhoto.url, 2000) : "/media/all-cadets.jpg"
          }
          alt={
            corpsPhoto?.alt ??
            "The cadets of OH-20221 AFJROTC assembled in uniform for a unit photograph."
          }
          loading="lazy"
        />
        <p className="pub-band__caption">
          {corpsPhoto?.caption ?? `The cadets of OH-20221 · ${UNIT.school}`}
        </p>
      </section>

      {/* ── Instructors ─────────────────────────────────────────────── */}
      <section className="pub-section pub-section--rule" aria-labelledby="instructors-heading">
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">04</span>Unit leadership
            </p>
            <div>
              <h2 className="pub-h2" id="instructors-heading">
                The instructors.
              </h2>
            </div>
          </div>

          {instructors.length === 0 ? (
            <p className="pub-empty">
              No instructors have been added yet. Staff can add them under Admin &rarr; Website
              &rarr; Instructors.
            </p>
          ) : (
            <div className="pub-grid pub-grid--2">
              {instructors.map((i) => (
                <article className="pub-instructor" key={i.id}>
                  {i.photoUrl && (
                    <div className="pub-figure__frame" style={{ aspectRatio: "4 / 3" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={toDriveThumbnail(i.photoUrl, 800)}
                        alt={`${i.name}, ${i.title}`}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="pub-instructor__name">{i.name}</h3>
                    <p className="pub-instructor__role">{i.title}</p>
                  </div>
                  <p className="pub-instructor__bio">{i.bio}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="pub-section pub-section--rule" aria-labelledby="faq-heading">
          <div className="pub-wrap">
            <div className="pub-sectionhead">
              <p className="pub-sectionhead__label">
                <span className="pub-num">05</span>Common questions
              </p>
              <div>
                <h2 className="pub-h2" id="faq-heading">
                  What families ask.
                </h2>
              </div>
            </div>

            {/* <details>/<summary> is keyboard-operable and screen-reader
                friendly with no JavaScript at all. */}
            <div className="pub-faq">
              {faqs.map((f) => (
                <details className="pub-faq__item" key={f.id}>
                  <summary className="pub-faq__q">
                    {f.question}
                    <span className="pub-faq__sign" aria-hidden="true" />
                  </summary>
                  <div className="pub-faq__a">
                    {f.answer
                      .split("\n")
                      .filter((l) => l.trim() !== "")
                      .map((line, idx) => (
                        <p key={idx} style={{ marginBottom: "0.7rem" }}>
                          {line}
                        </p>
                      ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contact ─────────────────────────────────────────────────── */}
      <section
        className="pub-section pub-section--rule"
        id="contact"
        aria-labelledby="contact-heading"
      >
        <div className="pub-wrap">
          <div className="pub-sectionhead">
            <p className="pub-sectionhead__label">
              <span className="pub-num">{faqs.length > 0 ? "06" : "05"}</span>Contact
            </p>
            <div>
              <h2 className="pub-h2" id="contact-heading">
                Get in touch.
              </h2>
              <p className="pub-lede">
                Questions about joining, scheduling, or the program in general? Send a message and
                the instructor staff will get back to you.
              </p>
            </div>
          </div>

          <div className="pub-split">
            <ContactForm />

            <div>
              <h3 className="pub-footer__heading">Unit office</h3>
              <address className="pub-footer__text" style={{ marginBottom: "2rem" }}>
                {UNIT.school}
                <br />
                {UNIT.address.street}
                <br />
                {UNIT.address.city}, {UNIT.address.state} {UNIT.address.zip}
              </address>

              <h3 className="pub-footer__heading">Instructor staff</h3>
              <p className="pub-footer__text">
                {CONTACTS.sasi.name}, {CONTACTS.sasi.title}
                <br />
                <a href={`mailto:${CONTACTS.sasi.email}`}>{CONTACTS.sasi.email}</a>
                <br />
                <br />
                {CONTACTS.asi.name}, {CONTACTS.asi.title}
                <br />
                <a href={`mailto:${CONTACTS.asi.email}`}>{CONTACTS.asi.email}</a>
              </p>

              <p className="pub-footer__text" style={{ marginTop: "2rem" }}>
                Current cadets should use the{" "}
                <Link href="/login" style={{ color: "var(--accent)" }}>
                  cadet portal
                </Link>{" "}
                for unit business.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

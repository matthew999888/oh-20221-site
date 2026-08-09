import type { Metadata } from "next";
import PageHeader from "../PageHeader";
import { CONTACTS, POLICY_LAST_UPDATED, UNIT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "Our commitment to WCAG 2.1 Level AA conformance, what we have done, known limitations, and how to report an accessibility barrier."
};

const SECTIONS = [
  ["commitment", "Our commitment"],
  ["standard", "Conformance standard"],
  ["measures", "What we have done"],
  ["limitations", "Known limitations"],
  ["feedback", "Report a barrier"],
  ["alternative", "Getting content another way"],
  ["formal", "Formal complaints"]
] as const;

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Accessibility Statement"
        lede="We want every cadet, family member, and visitor to be able to use this site."
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          <p className="pub-updated">Last updated: {POLICY_LAST_UPDATED}</p>

          <nav className="pub-toc" aria-labelledby="toc-heading">
            <h2 className="pub-toc__title" id="toc-heading">
              On this page
            </h2>
            <ol>
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="pub-prose">
            <h2 id="commitment">Our commitment</h2>
            <p>
              {UNIT.designation} AFJROTC and the {UNIT.district} are committed to making this
              website usable by everyone, including people who use screen readers, keyboard-only
              navigation, screen magnification, speech input, or captioning.
            </p>
            <p>
              As a public entity, the district is subject to Title II of the Americans with
              Disabilities Act and to Section 504 of the Rehabilitation Act. In April 2024 the U.S.
              Department of Justice adopted a rule (28 CFR Part 35) setting{" "}
              <strong>WCAG 2.1 Level AA</strong> as the technical standard for web content
              published by public entities. We are building to that standard.
            </p>

            <h2 id="standard">Conformance standard</h2>
            <p>
              We aim for conformance with the{" "}
              <a
                href="https://www.w3.org/TR/WCAG21/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Web Content Accessibility Guidelines (WCAG) 2.1
              </a>{" "}
              at Level AA<span className="sr-only"> (opens in a new tab)</span>.
            </p>
            <p>
              <strong>Current status: partially conformant.</strong> &ldquo;Partially
              conformant&rdquo; means most of the site meets the standard, but some content does
              not yet fully conform. The known gaps are listed below. We have not yet commissioned
              an independent third-party audit.
            </p>

            <h2 id="measures">What we have done</h2>
            <p>Accessibility work built into the public site includes:</p>
            <ul>
              <li>A &ldquo;skip to main content&rdquo; link as the first item on every page</li>
              <li>
                Text and background color combinations checked to meet the 4.5:1 contrast minimum
                for body text and 3:1 for large text
              </li>
              <li>
                A visible focus indicator on every link, button, and form control, so keyboard
                users can always see where they are
              </li>
              <li>
                Full keyboard operability — including the navigation menu, calendar, and photo
                viewer, which can be closed with the <kbd>Esc</kbd> key
              </li>
              <li>Proper heading order, landmark regions, and breadcrumb navigation on every page</li>
              <li>Labels on all form fields, not placeholder text alone</li>
              <li>
                Status messages (such as search result counts) announced to screen readers as they
                change
              </li>
              <li>
                Respect for the operating system&rsquo;s &ldquo;reduce motion&rdquo; setting, and a
                pause control for the background video on the home page
              </li>
              <li>Touch targets sized at least 44 by 44 pixels</li>
              <li>Layouts that reflow to a single column without horizontal scrolling at 320px wide</li>
              <li>Information never conveyed by color alone</li>
            </ul>

            <h2 id="limitations">Known limitations</h2>
            <p>
              We would rather list these honestly than claim full conformance. We are working on
              each:
            </p>
            <ul>
              <li>
                <strong>Photo gallery descriptions.</strong> Photographs added by unit staff do not
                always have descriptive captions. Images without a caption are currently exposed to
                screen readers with a generic label. We are adding a required description field for
                new uploads.
              </li>
              <li>
                <strong>The cadet portal.</strong> The password-protected portal has not yet been
                through the same accessibility pass as the public site. Cadets who encounter a
                barrier there should contact an instructor for an alternative.
              </li>
              <li>
                <strong>Third-party content.</strong> Gallery images are served from Google Drive
                and bot verification is provided by Cloudflare Turnstile. We do not control the
                accessibility of those services.
              </li>
              <li>
                <strong>Documents.</strong> PDFs generated by the portal may not be fully tagged
                for screen readers. Contact us for an accessible version of any document.
              </li>
            </ul>

            <h2 id="feedback">Report a barrier</h2>
            <p>
              If you run into something on this site you cannot use, please tell us. Reports from
              real users are the fastest way we find problems.
            </p>
            <p>Include, if you can: the page address, what you were trying to do, and what assistive technology or browser you were using.</p>
            <p>
              {CONTACTS.sasi.name}, {CONTACTS.sasi.title} —{" "}
              <a href={`mailto:${CONTACTS.sasi.email}`}>{CONTACTS.sasi.email}</a>
              <br />
              {CONTACTS.asi.name}, {CONTACTS.asi.title} —{" "}
              <a href={`mailto:${CONTACTS.asi.email}`}>{CONTACTS.asi.email}</a>
              <br />
              {UNIT.school}, {UNIT.address.street}, {UNIT.address.city}, {UNIT.address.state}{" "}
              {UNIT.address.zip}
            </p>
            <div className="pub-callout">
              We aim to acknowledge accessibility reports within{" "}
              <strong>five school days</strong> and to describe a fix or a workaround within{" "}
              <strong>fifteen school days</strong>.
            </div>

            <h2 id="alternative">Getting content another way</h2>
            <p>
              If any information on this site is not accessible to you, we will provide it in
              another format — large print, plain text, email, or read aloud over the phone — at no
              cost. Contact the instructor staff above and tell us what format works for you.
            </p>

            <h2 id="formal">Formal complaints</h2>
            <p>
              If you are not satisfied with our response, you may contact the {UNIT.district}
              &rsquo;s Section 504 / ADA coordinator through the district administrative office.
              You also have the right to file a complaint with the U.S. Department of
              Education&rsquo;s Office for Civil Rights, or with the U.S. Department of Justice
              Civil Rights Division.
            </p>

            {/* NOTE FOR MAINTAINERS (removed from the public page at the
                unit's request, kept here so it is not lost):
                Two things on this page are still placeholders and are
                now published as commitments —
                  1. the five / fifteen school-day response times above;
                  2. the 504/ADA coordinator, referred to generically
                     rather than named.
                An accessibility statement should name a specific person
                with direct contact details. Confirm both with the
                district administration. */}
          </div>
        </div>
      </div>
    </>
  );
}

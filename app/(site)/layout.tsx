import Link from "next/link";
import "../public-site.css";
import SiteHeader from "./SiteHeader";

function SiteFooter() {
  return (
    <footer className="pub-footer">
      <div className="pub-wrap pub-footer__grid">
        <div>
          <div className="pub-brand">
            <span className="pub-brand__mark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/badge.png" alt="" />
            </span>
            <span className="pub-brand__text">
              <span className="pub-brand__id">OH-20221 AFJROTC</span>
              <span className="pub-brand__school">Logan High School</span>
            </span>
          </div>
          <p className="pub-footer__tagline">
            Air Force Junior ROTC, Unit OH-20221 — developing citizens of character dedicated to
            serving their nation and community.
          </p>
        </div>

        <nav aria-labelledby="footer-nav-heading">
          <h2 className="pub-footer__heading" id="footer-nav-heading">
            Navigation
          </h2>
          <ul className="pub-footer__list">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/announcements">Announcements</Link>
            </li>
            <li>
              <Link href="/calendar">Calendar</Link>
            </li>
            <li>
              <Link href="/gallery">Gallery</Link>
            </li>
            <li>
              <Link href="/roster">Roster</Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-portal-heading">
          <h2 className="pub-footer__heading" id="footer-portal-heading">
            Cadet Portal
          </h2>
          <ul className="pub-footer__list">
            <li>
              <Link href="/login">Member Login</Link>
            </li>
            <li>
              <Link href="/signup">Request an Account</Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="pub-footer__heading">Contact</h2>
          <address className="pub-footer__text">
            Logan High School
            <br />
            14470 State Route 328
            <br />
            Logan, OH 43138
            <br />
            <br />
            <a href="mailto:lroberts@lhsd.k12.oh.us">lroberts@lhsd.k12.oh.us</a>
            <br />
            Maj Lance Roberts, SASI
            <br />
            <br />
            <a href="mailto:jgeorge@lhsd.k12.oh.us">jgeorge@lhsd.k12.oh.us</a>
            <br />
            MSgt Jeffery George, ASI
          </address>
        </div>
      </div>

      <div className="pub-footer__bottom">
        <div className="pub-wrap">
          {/* Required-ish disclaimers for a public-school unit page that
              uses USAF marks. Reviewed content lives on /privacy and
              /terms; this is the short form. */}
          <p className="pub-footer__disclaimer">
            OH-20221 AFJROTC is a citizenship and leadership program offered at Logan High School,
            Logan-Hocking Local School District. This is not an official U.S. Air Force or
            Department of Defense website, and the appearance of USAF or DoD visual information
            does not imply or constitute endorsement. Enrollment in AFJROTC carries no military
            service obligation.
          </p>
          <div className="pub-footer__bottom-inner">
            <p className="pub-footer__copy">
              &copy; {new Date().getFullYear()} OH-20221 AFJROTC, Logan High School.
            </p>
            <ul className="pub-footer__legal">
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms of Use</Link>
              </li>
              <li>
                <Link href="/accessibility">Accessibility</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * Structured data describing the unit as an educational organization.
 *
 * This is what lets search engines show the address, contact, and
 * parent school as a knowledge panel rather than guessing from page
 * text. Scoped to the public site only — the portal has no business
 * being described to crawlers.
 */
function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loganjrotc.org";
  const data = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "OH-20221 Air Force Junior ROTC",
    alternateName: "OH-20221 AFJROTC",
    description:
      "Air Force Junior ROTC unit OH-20221 at Logan High School — a leadership and citizenship program developing citizens of character dedicated to serving their nation and community.",
    url: siteUrl,
    logo: `${siteUrl}/badge.png`,
    image: `${siteUrl}/media/hero-poster.jpg`,
    parentOrganization: {
      "@type": "HighSchool",
      name: "Logan High School",
      address: {
        "@type": "PostalAddress",
        streetAddress: "14470 State Route 328",
        addressLocality: "Logan",
        addressRegion: "OH",
        postalCode: "43138",
        addressCountry: "US"
      }
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "14470 State Route 328",
      addressLocality: "Logan",
      addressRegion: "OH",
      postalCode: "43138",
      addressCountry: "US"
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Admissions",
      email: "lroberts@lhsd.k12.oh.us",
      areaServed: "US",
      availableLanguage: "English"
    }
  };

  return (
    <script
      type="application/ld+json"
      // Content is a fixed object literal built above, not user input,
      // so there is nothing here for a visitor to inject into.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pub-shell">
      <StructuredData />
      {/* First tabbable element on the page (WCAG 2.4.1 Bypass Blocks). */}
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <SiteHeader />
      <main className="pub-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

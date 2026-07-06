import Link from "next/link";

function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        <span className="badge-ring badge-ring--sm" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/badge.png" alt="" className="site-header__brand-badge" />
        </span>
        <span className="site-header__brand-text">
          <span className="site-header__brand-id">OH-20221 AFJROTC</span>
          <span className="site-header__brand-school">Logan High School</span>
        </span>
      </Link>
      <input type="checkbox" id="site-nav-toggle" className="site-header__nav-toggle-input" />
      <label htmlFor="site-nav-toggle" className="site-header__nav-toggle" aria-label="Toggle menu">
        <span />
        <span />
        <span />
      </label>
      <nav className="site-header__nav" aria-label="Main">
        <Link href="/">Home</Link>
        <Link href="/announcements">Announcements</Link>
        <Link href="/calendar">Calendar</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/roster">Roster</Link>
        <Link href="/login" className="site-header__cta">
          Member Login
        </Link>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="hh-footer">
      <div className="hh-footer-inner">
        <div className="hh-footer-brand">
          <div className="site-header__brand" style={{ pointerEvents: "none" }}>
            <span className="badge-ring badge-ring--sm" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/badge.png" alt="" className="site-header__brand-badge" />
            </span>
            <span className="site-header__brand-text">
              <span className="site-header__brand-id">OH-20221 AFJROTC</span>
              <span className="site-header__brand-school">Logan High School</span>
            </span>
          </div>
          <p className="hh-footer-tagline">Air Force Junior ROTC &middot; United States Air Force</p>
        </div>

        <div className="hh-footer-col">
          <div className="hh-footer-heading">Navigation</div>
          <Link href="/">Home</Link>
          <Link href="/announcements">Announcements</Link>
          <Link href="/calendar">Calendar</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/roster">Roster</Link>
        </div>

        <div className="hh-footer-col">
          <div className="hh-footer-heading">Unit Info</div>
          <Link href="/login">Cadet Login</Link>
        </div>

        <div className="hh-footer-col">
          <div className="hh-footer-heading">Contact</div>
          <p className="hh-footer-text">
            Logan High School
            <br />
            14470 State Route 328
            <br />
            Logan, OH 43138
          </p>
          <a href="mailto:lroberts@lhsd.k12.oh.us" className="hh-footer-text">
            Lance Roberts &lt;lroberts@lhsd.k12.oh.us&gt;
          </a>
          <a href="mailto:jgeorge@lhsd.k12.oh.us" className="hh-footer-text">
            Jeff George &lt;jgeorge@lhsd.k12.oh.us&gt;
          </a>
        </div>
      </div>

      <div className="hh-footer-bottom">
        <p>&copy; {new Date().getFullYear()} OH-20221 AFJROTC &middot; Logan High School. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb-2" />
      </div>
      <div className="site-shell">
        <SiteHeader />
        <div className="site-shell__content">{children}</div>
        <SiteFooter />
      </div>
    </>
  );
}
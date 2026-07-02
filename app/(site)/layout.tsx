import Link from "next/link";

function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        <span className="badge-ring badge-ring--sm" aria-hidden="true" />
        <span className="site-header__brand-text">
          <span className="site-header__brand-id">OH-20221 AFJROTC</span>
          <span className="site-header__brand-school">Logan High School</span>
        </span>
      </Link>
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
    <footer className="site-footer">
      <p>OH-20221 Air Force Junior ROTC &middot; Logan High School &middot; Logan, Ohio</p>
      <p className="site-footer__sub">&copy; {new Date().getFullYear()} OH-20221 AFJROTC. All rights reserved.</p>
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

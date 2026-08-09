"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/announcements", label: "Announcements" },
  { href: "/calendar", label: "Calendar" },
  { href: "/gallery", label: "Gallery" },
  { href: "/roster", label: "Roster" }
];

/* The old header toggled the mobile menu with a hidden checkbox and a
   sibling selector. That renders as an unlabeled checkbox to screen
   readers, can't announce open/closed state, and can't be dismissed
   with Escape. This is the same interaction as a real button with
   aria-expanded / aria-controls. */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on navigation — otherwise the panel stays open over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        // Send focus back to the control that opened the panel, so
        // keyboard users don't get dropped at the top of the document.
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="pub-header" ref={headerRef}>
      <div className="pub-wrap pub-header__bar">
        <Link href="/" className="pub-brand">
          <span className="pub-brand__mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/badge.png" alt="" />
          </span>
          <span className="pub-brand__text">
            <span className="pub-brand__id">OH-20221 AFJROTC</span>
            <span className="pub-brand__school">Logan High School</span>
          </span>
        </Link>

        <button
          type="button"
          ref={toggleRef}
          className="pub-navtoggle"
          aria-expanded={open}
          aria-controls="pub-primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="pub-navtoggle__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          Menu
        </button>

        {/* `hidden` is driven by viewport width in CSS for desktop; on
            mobile the attribute below is what actually collapses it. */}
        <nav
          className="pub-nav"
          id="pub-primary-nav"
          aria-label="Main"
          data-open={open ? "true" : "false"}
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="pub-nav__link"
              aria-current={isCurrent(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="pub-nav__cta">
            Member Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

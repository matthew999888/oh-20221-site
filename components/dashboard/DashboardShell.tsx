"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/nav";
import { canView } from "@/lib/permissions";

export default function DashboardShell({
  roles,
  name,
  roleLabel,
  children
}: {
  roles: string[];
  name: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className={`dash-shell${navOpen ? " nav-open" : ""}`}>
      <nav className="dash-sidebar" aria-label="Dashboard navigation">
        <div className="dash-sidebar__brand">
          <span className="dash-sidebar__brand-id">OH-20221</span>
          <span className="dash-sidebar__brand-name">AFJROTC</span>
        </div>

        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) => canView(roles, item.page));
          if (visibleItems.length === 0) return null;

          return (
            <div className="dash-sidebar__section" key={section.label}>
              <p className="dash-sidebar__section-label">{section.label}</p>
              <ul>
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`dash-sidebar__link${active ? " is-active" : ""}`}
                        onClick={() => setNavOpen(false)}
                      >
                        <i className={item.icon} aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="dash-sidebar__footer">
          <Link href="/" className="dash-sidebar__link">
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            <span>Back to public site</span>
          </Link>
        </div>
      </nav>

      <div className="dash-backdrop" onClick={() => setNavOpen(false)} />

      <div className="dash-main">
        <header className="dash-header">
          <button
            className="dash-header__menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setNavOpen((v) => !v)}
          >
            <i className="fa-solid fa-bars" />
          </button>
          <div className="dash-header__spacer" />
          <div className="dash-header__user">
            <div className="dash-header__user-info">
              <span className="dash-header__user-name">{name}</span>
              <span className="dash-header__user-role">{roleLabel}</span>
            </div>
            <button className="btn-small" onClick={() => signOut({ callbackUrl: "/" })}>
              <i className="fa-solid fa-right-from-bracket" /> Sign out
            </button>
          </div>
        </header>

        <main className="dash-content">{children}</main>
      </div>
    </div>
  );
}

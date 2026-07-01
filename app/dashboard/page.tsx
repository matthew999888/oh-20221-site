export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { requirePagePermission } from "@/lib/permissions";
import Link from "next/link";

export default async function DashboardHomePage() {
  const session = await requirePagePermission("dashboard", "view");

  const [announcements, nextEvents] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 3
    }),
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 3
    })
  ]);

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Welcome, {session.user.name?.split(" ")[0] ?? "Cadet"}</h1>
      <p className="dash-page__subtitle">Here's what's happening with OH-20221.</p>

      <div className="dash-grid">
        <section className="dash-card">
          <header className="dash-card__header">
            <h2>Recent Announcements</h2>
            <Link href="/dashboard/announcements">View all</Link>
          </header>
          {announcements.length === 0 ? (
            <p className="content-block__empty">No announcements yet.</p>
          ) : (
            <ul className="dash-list">
              {announcements.map((a) => (
                <li key={a.id}>
                  <span className="dash-list__title">{a.pinned && "📌 "}{a.title}</span>
                  <span className="dash-list__meta">{a.publishAt.toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card">
          <header className="dash-card__header">
            <h2>Upcoming Events</h2>
            <Link href="/calendar">View calendar</Link>
          </header>
          {nextEvents.length === 0 ? (
            <p className="content-block__empty">No upcoming events.</p>
          ) : (
            <ul className="dash-list">
              {nextEvents.map((e) => (
                <li key={e.id}>
                  <span className="dash-list__title">{e.title}</span>
                  <span className="dash-list__meta">
                    {e.startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

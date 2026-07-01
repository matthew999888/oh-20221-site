export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import CalendarClient from "./CalendarClient";

export default async function CalendarPage({
  searchParams
}: {
  searchParams: { y?: string; m?: string };
}) {
  const now = new Date();
  const year = parseInt(searchParams.y ?? "", 10) || now.getFullYear();
  const month = (parseInt(searchParams.m ?? "", 10) || now.getMonth() + 1) - 1; // 0-indexed

  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 1);

  const events = await prisma.calendarEvent.findMany({
    where: { startsAt: { gte: rangeStart, lt: rangeEnd } },
    orderBy: { startsAt: "asc" }
  });

  const serialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
    allDay: e.allDay,
    category: e.category
  }));

  return (
    <main className="page-section">
      <h1 className="page-section__title">Calendar</h1>
      <p className="page-section__sub">Drill nights, PT, ceremonies, and competitions. Click a day to see details.</p>
      <CalendarClient year={year} month={month} events={serialized} />
    </main>
  );
}

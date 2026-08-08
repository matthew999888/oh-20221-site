export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PageHeader from "../PageHeader";
import CalendarClient from "./CalendarClient";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Next 15: `searchParams` is a Promise and must be awaited.
export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}): Promise<Metadata> {
  const { y, m } = await searchParams;
  const now = new Date();
  const year = parseInt(y ?? "", 10) || now.getFullYear();
  const month = (parseInt(m ?? "", 10) || now.getMonth() + 1) - 1;
  return {
    title: `Calendar — ${MONTH_NAMES[month] ?? ""} ${year}`,
    description: "Drill nights, PT, ceremonies, and competitions for OH-20221 AFJROTC."
  };
}

export default async function CalendarPage({
  searchParams
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;
  const now = new Date();
  const year = parseInt(y ?? "", 10) || now.getFullYear();
  const month = (parseInt(m ?? "", 10) || now.getMonth() + 1) - 1; // 0-indexed

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
    <>
      <PageHeader
        eyebrow="Unit Schedule"
        title="Calendar"
        lede="Drill nights, PT, ceremonies, and competitions. Select a day to see its details."
      />

      <div className="pub-section pub-section--tight">
        <div className="pub-wrap">
          <CalendarClient year={year} month={month} events={serialized} />
        </div>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import OpsOrderClient from "./OpsOrderClient";

const DEFAULT_HONOR_CODE = "I will not lie, cheat, or steal, nor will I tolerate those who do.";

function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

export default async function OpsOrderPage() {
  const session = await requirePagePermission("ops-order", "view");
  const editable = canEdit(session.user.roles, "ops-order");

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const twoWeeksOut = new Date(now);
  twoWeeksOut.setDate(twoWeeksOut.getDate() + 14);

  const [status, upcomingEvents, ldrThisWeek, staffMessages] = await Promise.all([
    prisma.opsOrderStatus.findUnique({ where: { id: "singleton" } }),
    prisma.calendarEvent.findMany({
      where: { startsAt: { gte: now, lte: twoWeeksOut } },
      orderBy: { startsAt: "asc" },
      take: 8
    }),
    prisma.calendarEvent.findMany({
      where: {
        startsAt: { gte: weekStart, lt: weekEnd },
        category: { equals: "ldr", mode: "insensitive" }
      },
      orderBy: { startsAt: "asc" }
    }),
    prisma.announcement.findMany({
      where: { ldrSlug: null, publishAt: { lte: now } },
      orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
      take: 5
    })
  ]);

  return (
    <OpsOrderClient
      editable={editable}
      status={{
        uniformOfTheDay: status?.uniformOfTheDay ?? "",
        ptDay: status?.ptDay ?? "",
        ptDetails: status?.ptDetails ?? "",
        honorCode: status?.honorCode ?? DEFAULT_HONOR_CODE
      }}
      upcomingEvents={upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        location: e.location
      }))}
      ldrThisWeek={ldrThisWeek.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        location: e.location
      }))}
      staffMessages={staffMessages.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        publishAt: a.publishAt.toISOString()
      }))}
    />
  );
}

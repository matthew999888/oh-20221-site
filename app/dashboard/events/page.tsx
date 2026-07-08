export const dynamic = "force-dynamic";

import { requirePagePermission, canEdit } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import EventsClient, { type EventRecord, type RosterOption } from "./EventsClient";

export default async function EventsPage() {
  const session = await requirePagePermission("events", "view");
  const editable = canEdit(session.user.roles, "events");

  const [events, roster] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      include: { attendees: { include: { rosterEntry: true } } }
    }),
    prisma.rosterEntry.findMany({
      where: { active: true },
      orderBy: [{ flight: "asc" }, { lastName: "asc" }]
    })
  ]);

  const eventRecords: EventRecord[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date.toISOString(),
    hours: e.hours,
    location: e.location,
    description: e.description,
    attendees: e.attendees.map((a) => ({
      rosterEntryId: a.rosterEntryId,
      name: `${a.rosterEntry.lastName}, ${a.rosterEntry.firstName}`,
      hours: a.hoursOverride ?? e.hours
    }))
  }));

  const rosterOptions: RosterOption[] = roster.map((r) => ({
    id: r.id,
    name: `${r.lastName}, ${r.firstName}`,
    flight: r.flight
  }));

  return <EventsClient initialEvents={eventRecords} roster={rosterOptions} editable={editable} />;
}

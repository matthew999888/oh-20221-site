"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-log";
import type { EventTypeValue } from "@/lib/event-types";

export type EventInput = {
  title: string;
  type: EventTypeValue;
  date: string; // yyyy-mm-dd
  hours: number;
  location: string;
  description: string;
  attendeeIds: string[];
};

function revalidateEventPages() {
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/ops-order");
}

export async function createEvent(data: EventInput) {
  const session = await assertPagePermission("events", "edit");

  const event = await prisma.event.create({
    data: {
      title: data.title.trim() || "Untitled Event",
      type: data.type,
      date: new Date(data.date),
      hours: Number.isFinite(data.hours) ? data.hours : 0,
      location: data.location.trim() || null,
      description: data.description.trim() || null,
      createdById: session.user.id,
      attendees: {
        create: data.attendeeIds.map((rosterEntryId) => ({ rosterEntryId }))
      }
    },
    include: { attendees: { include: { rosterEntry: true } } }
  });

  await logActivity(session.user.id, "event.created", "Event", event.id, { attendeeCount: data.attendeeIds.length });
  revalidateEventPages();
  return event;
}

export async function updateEvent(id: string, data: EventInput) {
  const session = await assertPagePermission("events", "edit");

  // Simplest correct approach: wipe and recreate the attendance rows so
  // the attendee list always matches exactly what's submitted.
  await prisma.eventAttendance.deleteMany({ where: { eventId: id } });

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: data.title.trim() || "Untitled Event",
      type: data.type,
      date: new Date(data.date),
      hours: Number.isFinite(data.hours) ? data.hours : 0,
      location: data.location.trim() || null,
      description: data.description.trim() || null,
      attendees: {
        create: data.attendeeIds.map((rosterEntryId) => ({ rosterEntryId }))
      }
    },
    include: { attendees: { include: { rosterEntry: true } } }
  });

  await logActivity(session.user.id, "event.updated", "Event", id, { attendeeCount: data.attendeeIds.length });
  revalidateEventPages();
  return event;
}

export async function deleteEvent(id: string) {
  const session = await assertPagePermission("events", "edit");

  await prisma.event.delete({ where: { id } });

  await logActivity(session.user.id, "event.deleted", "Event", id);
  revalidateEventPages();
}

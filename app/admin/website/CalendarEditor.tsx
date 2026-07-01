"use client";

import { useState, useTransition } from "react";
import { createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, type CalendarEventInput } from "./_actions";

export type SiteCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  category: string | null;
};

function toDatetimeLocal(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CalendarEditor({ initial }: { initial: SiteCalendarEvent[] }) {
  const [events, setEvents] = useState(initial);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: CalendarEventInput) {
    startTransition(async () => {
      const created = await createCalendarEvent(input);
      setEvents((prev) =>
        [
          {
            id: created.id,
            title: created.title,
            description: created.description,
            location: created.location,
            startsAt: created.startsAt.toString(),
            endsAt: created.endsAt ? created.endsAt.toString() : null,
            allDay: created.allDay,
            category: created.category
          },
          ...prev
        ].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      );
      setComposing(false);
    });
  }

  function handleUpdate(id: string, input: CalendarEventInput) {
    startTransition(async () => {
      await updateCalendarEvent(id, input);
      setEvents((prev) =>
        prev
          .map((e) =>
            e.id === id
              ? {
                  ...e,
                  title: input.title,
                  description: input.description || null,
                  location: input.location || null,
                  startsAt: input.startsAt,
                  endsAt: input.endsAt,
                  allDay: input.allDay,
                  category: input.category || null
                }
              : e
          )
          .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      );
      setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      await deleteCalendarEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    });
  }

  return (
    <div>
      <div className="content-block__actions" style={{ marginBottom: "1rem" }}>
        <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
          <i className="fa-solid fa-plus" /> New event
        </button>
      </div>

      {composing && (
        <CalendarEventForm onCancel={() => setComposing(false)} onSubmit={handleCreate} isPending={isPending} />
      )}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Title</th>
              <th>Location</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && !composing && (
              <tr>
                <td colSpan={5} className="content-block__empty">
                  No events scheduled yet.
                </td>
              </tr>
            )}
            {events.map((e) =>
              editingId === e.id ? (
                <tr key={e.id}>
                  <td colSpan={5}>
                    <CalendarEventForm
                      initial={e}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(input) => handleUpdate(e.id, input)}
                      isPending={isPending}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={e.id}>
                  <td>
                    {e.allDay
                      ? new Date(e.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : new Date(e.startsAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                  </td>
                  <td>{e.title}</td>
                  <td>{e.location ?? "—"}</td>
                  <td>{e.category ?? "—"}</td>
                  <td>
                    <div className="content-box__controls">
                      <button className="icon-btn" title="Edit" onClick={() => setEditingId(e.id)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button className="icon-btn icon-btn--danger" title="Delete" onClick={() => handleDelete(e.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarEventForm({
  initial,
  onSubmit,
  onCancel,
  isPending
}: {
  initial?: SiteCalendarEvent;
  onSubmit: (input: CalendarEventInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initial?.startsAt ?? new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initial?.endsAt ?? null));
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [category, setCategory] = useState(initial?.category ?? "");

  return (
    <div className="content-box__edit" style={{ marginBottom: "1rem" }}>
      <input className="form-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="form-input"
        rows={3}
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        className="form-input"
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        className="form-input"
        placeholder="Category, e.g. Drill, PT, Ceremony (optional)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <label className="form-label">
        Starts at
        <input className="form-input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
      </label>
      <label className="form-label">
        Ends at (optional)
        <input className="form-input" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </label>
      <label className="form-label" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
        All day
      </label>
      <div className="content-block__actions">
        <button
          className="btn-small btn-small--primary"
          disabled={isPending || !title.trim() || !startsAt}
          onClick={() =>
            onSubmit({ title, description, location, startsAt, endsAt: endsAt || null, allDay, category })
          }
        >
          Save
        </button>
        <button className="btn-small" disabled={isPending} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

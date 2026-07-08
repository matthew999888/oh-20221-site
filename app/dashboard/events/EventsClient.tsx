"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, deleteEvent, updateEvent, type EventInput } from "./_actions";
import { EVENT_TYPES, eventTypeIcon, eventTypeLabel, type EventTypeValue } from "@/lib/event-types";

export type EventRecord = {
  id: string;
  title: string;
  type: string;
  date: string;
  hours: number;
  location: string | null;
  description: string | null;
  attendees: { rosterEntryId: string; name: string; hours: number }[];
};

export type RosterOption = { id: string; name: string; flight: string | null };

const EMPTY_FORM: EventInput = {
  title: "",
  type: "other",
  date: new Date().toISOString().slice(0, 10),
  hours: 1,
  location: "",
  description: "",
  attendeeIds: []
};

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EventsClient({
  initialEvents,
  roster,
  editable
}: {
  initialEvents: EventRecord[];
  roster: RosterOption[];
  editable: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [typeFilter, setTypeFilter] = useState<"all" | EventTypeValue>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"log" | "summary">("log");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventInput>(EMPTY_FORM);
  const [rosterSearch, setRosterSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (search.trim() && !e.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [events, typeFilter, search]);

  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter((r) => r.name.toLowerCase().includes(q) || (r.flight ?? "").toLowerCase().includes(q));
  }, [roster, rosterSearch]);

  const cadetTotals = useMemo(() => {
    const totals = new Map<string, { name: string; total: number; byType: Record<string, number>; count: number }>();
    for (const e of events) {
      for (const a of e.attendees) {
        const entry = totals.get(a.rosterEntryId) ?? { name: a.name, total: 0, byType: {}, count: 0 };
        entry.total += a.hours;
        entry.count += 1;
        entry.byType[e.type] = (entry.byType[e.type] ?? 0) + a.hours;
        totals.set(a.rosterEntryId, entry);
      }
    }
    return Array.from(totals.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [events]);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setRosterSearch("");
    setShowForm(true);
  }

  function openEditForm(e: EventRecord) {
    setForm({
      title: e.title,
      type: e.type as EventTypeValue,
      date: e.date.slice(0, 10),
      hours: e.hours,
      location: e.location ?? "",
      description: e.description ?? "",
      attendeeIds: e.attendees.map((a) => a.rosterEntryId)
    });
    setEditingId(e.id);
    setRosterSearch("");
    setShowForm(true);
  }

  function toggleAttendee(id: string) {
    setForm((prev) => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(id)
        ? prev.attendeeIds.filter((x) => x !== id)
        : [...prev.attendeeIds, id]
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, form);
      } else {
        await createEvent(form);
      }
      setShowForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event and its attendance record? This can't be undone.")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    await deleteEvent(id);
    router.refresh();
  }

  function exportCsv() {
    const rows: (string | number)[][] = [["Cadet", "Total Hours", "Events Attended"]];
    for (const c of cadetTotals) rows.push([c.name, c.total, c.count]);
    downloadCsv(`cadet-hours-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Event & Hours Tracker</h1>
      <p className="dash-page__subtitle">
        Log unit events, mark which cadets attended, and track credited hours by LDR, squadron activity,
        community service, or other event types.
      </p>

      <div className="content-block__actions" style={{ marginBottom: "0.5rem" }}>
        <button className={`btn-small${view === "log" ? " btn-small--primary" : ""}`} onClick={() => setView("log")}>
          <i className="fa-solid fa-list" /> Event Log
        </button>
        <button className={`btn-small${view === "summary" ? " btn-small--primary" : ""}`} onClick={() => setView("summary")}>
          <i className="fa-solid fa-chart-simple" /> Cadet Hour Totals
        </button>
        {editable && view === "log" && (
          <button className="btn-small btn-small--primary" style={{ marginLeft: "auto" }} onClick={openNewForm}>
            <i className="fa-solid fa-plus" /> Log Event
          </button>
        )}
        {view === "summary" && (
          <button className="btn-small" style={{ marginLeft: "auto" }} onClick={exportCsv}>
            <i className="fa-solid fa-file-arrow-down" /> Export CSV
          </button>
        )}
      </div>

      {showForm && (
        <section className="dash-card dash-card--full">
          <header className="dash-card__header">
            <h2>{editingId ? "Edit Event" : "Log a New Event"}</h2>
          </header>
          <div className="content-box__edit" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <label className="form-label">
              Title
              <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Fort Knox LDR Trip" />
            </label>
            <label className="form-label">
              Type
              <select className="form-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventTypeValue }))}>
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Date
              <input className="form-input" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </label>
            <label className="form-label">
              Hours (credited per attendee)
              <input
                className="form-input"
                type="number"
                min={0}
                step={0.25}
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: parseFloat(e.target.value) || 0 }))}
              />
            </label>
            <label className="form-label">
              Location
              <input className="form-input" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Optional" />
            </label>
          </div>
          <label className="form-label" style={{ display: "block", marginTop: "0.75rem" }}>
            Notes / description
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
          </label>

          <div style={{ marginTop: "1rem" }}>
            <p className="form-label" style={{ marginBottom: "0.4rem" }}>
              Cadets who attended ({form.attendeeIds.length} selected)
            </p>
            <input
              className="form-input"
              style={{ marginBottom: "0.5rem" }}
              placeholder="Search roster by name or flight…"
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
            />
            <div className="table-scroll" style={{ maxHeight: "260px", border: "1px solid var(--purple-900)", borderRadius: "8px" }}>
              <table className="data-table">
                <tbody>
                  {filteredRoster.map((r) => (
                    <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => toggleAttendee(r.id)}>
                      <td style={{ width: "2rem" }}>
                        <input type="checkbox" readOnly checked={form.attendeeIds.includes(r.id)} />
                      </td>
                      <td>{r.name}</td>
                      <td>{r.flight ?? "—"}</td>
                    </tr>
                  ))}
                  {filteredRoster.length === 0 && (
                    <tr>
                      <td colSpan={3} className="content-block__empty">No matching cadets</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="content-block__actions">
            <button className="btn-small btn-small--primary" onClick={handleSave} disabled={saving || !form.title.trim()}>
              <i className="fa-solid fa-check" /> {saving ? "Saving…" : editingId ? "Save Changes" : "Log Event"}
            </button>
            <button className="btn-small" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </section>
      )}

      {view === "log" ? (
        <>
          <div className="content-block__actions">
            <select className="form-input" style={{ maxWidth: "220px" }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as "all" | EventTypeValue)}>
              <option value="all">All event types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input className="form-input" style={{ maxWidth: "260px" }} placeholder="Search events…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {filteredEvents.length === 0 ? (
            <p className="content-block__empty">No events logged yet.</p>
          ) : (
            <div className="content-block__boxes">
              {filteredEvents.map((e) => (
                <article className="content-box" key={e.id}>
                  <div className="content-box__header">
                    <h3 className="content-box__title">
                      <i className={eventTypeIcon(e.type)} /> {e.title}
                    </h3>
                    <span className="oo-panel__tag">{eventTypeLabel(e.type)}</span>
                  </div>
                  <p style={{ color: "var(--text-300)", margin: "0.25rem 0" }}>
                    {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" · "}{e.hours} hr{e.hours === 1 ? "" : "s"}
                    {e.location && ` · ${e.location}`}
                    {" · "}{e.attendees.length} cadet{e.attendees.length === 1 ? "" : "s"}
                  </p>
                  {e.description && <p style={{ color: "var(--text-200)" }}>{e.description}</p>}

                  <button className="btn-small" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                    <i className={`fa-solid fa-chevron-${expandedId === e.id ? "up" : "down"}`} /> {expandedId === e.id ? "Hide" : "Show"} attendees
                  </button>

                  {expandedId === e.id && (
                    <ul className="oo-panel__list" style={{ marginTop: "0.6rem" }}>
                      {e.attendees.length === 0 ? (
                        <li><span>No attendees recorded</span></li>
                      ) : (
                        e.attendees.map((a) => (
                          <li key={a.rosterEntryId} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <strong>{a.name}</strong>
                            <span>{a.hours} hr{a.hours === 1 ? "" : "s"}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  )}

                  {editable && (
                    <div className="content-block__actions" style={{ marginTop: "0.6rem" }}>
                      <button className="btn-small" onClick={() => openEditForm(e)}><i className="fa-solid fa-pen" /> Edit</button>
                      <button className="btn-small" onClick={() => handleDelete(e.id)}><i className="fa-solid fa-trash" /> Delete</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <section className="dash-card dash-card--full">
          <header className="dash-card__header">
            <h2>Cadet Hour Totals</h2>
          </header>
          {cadetTotals.length === 0 ? (
            <p className="content-block__empty">No attendance recorded yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cadet</th>
                    <th>Events Attended</th>
                    <th>LDR hrs</th>
                    <th>Squadron hrs</th>
                    <th>Community Service hrs</th>
                    <th>Other hrs</th>
                    <th>Total hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {cadetTotals.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.count}</td>
                      <td>{(c.byType.ldr ?? 0).toFixed(2)}</td>
                      <td>{(c.byType.squadron_activity ?? 0).toFixed(2)}</td>
                      <td>{(c.byType.community_service ?? 0).toFixed(2)}</td>
                      <td>{(c.byType.other ?? 0).toFixed(2)}</td>
                      <td><strong>{c.total.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

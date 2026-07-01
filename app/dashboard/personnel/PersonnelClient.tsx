"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createRosterEntry,
  deleteRosterEntry,
  toggleRosterEntryActive,
  updateRosterEntry,
  type RosterEntryInput
} from "./_actions";

export type PersonnelRosterEntry = {
  id: string;
  firstName: string;
  lastName: string;
  grade: number | null;
  flight: string | null;
  rank: string | null;
  positionTitle: string | null;
  active: boolean;
};

export default function PersonnelClient({ initial }: { initial: PersonnelRosterEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [flightFilter, setFlightFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(true);
  const [isPending, startTransition] = useTransition();

  const flights = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.flight && set.add(e.flight));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = entries
    .filter((e) => (showInactive ? true : e.active))
    .filter((e) => (flightFilter === "all" ? true : e.flight === flightFilter))
    .sort((a, b) => (a.flight ?? "").localeCompare(b.flight ?? "") || a.lastName.localeCompare(b.lastName));

  function handleCreate(input: RosterEntryInput) {
    startTransition(async () => {
      const created = await createRosterEntry(input);
      setEntries((prev) => [...prev, { ...created }]);
      setComposing(false);
    });
  }

  function handleUpdate(id: string, input: RosterEntryInput) {
    startTransition(async () => {
      await updateRosterEntry(id, input);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
      setEditingId(null);
    });
  }

  function handleToggleActive(id: string, active: boolean) {
    startTransition(async () => {
      await toggleRosterEntryActive(id, active);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, active } : e)));
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Permanently delete this roster entry? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteRosterEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    });
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Personnel</h1>
      <p className="dash-page__subtitle">
        Full cadet roster — additions/edits here also update the read-only Roster views (dashboard and public site).
      </p>

      <div className="content-block__actions" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <select className="form-input" style={{ width: "auto" }} value={flightFilter} onChange={(e) => setFlightFilter(e.target.value)}>
          <option value="all">All flights</option>
          {flights.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <label className="role-chip" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
        <button className="btn-small btn-small--primary" onClick={() => setComposing(true)}>
          <i className="fa-solid fa-plus" /> Add cadet
        </button>
      </div>

      {composing && (
        <div className="content-box" style={{ marginTop: "1rem" }}>
          <RosterEntryForm onCancel={() => setComposing(false)} onSubmit={handleCreate} isPending={isPending} />
        </div>
      )}

      <div className="table-scroll" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Rank</th>
              <th>Grade</th>
              <th>Flight</th>
              <th>Position</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !composing && (
              <tr>
                <td colSpan={7} className="content-block__empty">
                  No cadets match this filter.
                </td>
              </tr>
            )}

            {filtered.map((e) =>
              editingId === e.id ? (
                <tr key={e.id}>
                  <td colSpan={7}>
                    <RosterEntryForm
                      initial={e}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(input) => handleUpdate(e.id, input)}
                      isPending={isPending}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={e.id} style={{ opacity: e.active ? 1 : 0.55 }}>
                  <td>
                    {e.lastName}, {e.firstName}
                  </td>
                  <td>{e.rank ?? "—"}</td>
                  <td>{e.grade ?? "—"}</td>
                  <td>{e.flight ?? "—"}</td>
                  <td>{e.positionTitle ?? "—"}</td>
                  <td>{e.active ? "Yes" : "No"}</td>
                  <td>
                    <div className="content-box__controls">
                      <button className="icon-btn" title="Edit" onClick={() => setEditingId(e.id)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="icon-btn"
                        title={e.active ? "Mark inactive" : "Mark active"}
                        disabled={isPending}
                        onClick={() => handleToggleActive(e.id, !e.active)}
                      >
                        <i className={`fa-solid ${e.active ? "fa-user-slash" : "fa-user-check"}`} />
                      </button>
                      <button className="icon-btn icon-btn--danger" title="Delete" disabled={isPending} onClick={() => handleDelete(e.id)}>
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

function RosterEntryForm({
  initial,
  onSubmit,
  onCancel,
  isPending
}: {
  initial?: PersonnelRosterEntry;
  onSubmit: (input: RosterEntryInput) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [grade, setGrade] = useState(initial?.grade?.toString() ?? "");
  const [flight, setFlight] = useState(initial?.flight ?? "");
  const [rank, setRank] = useState(initial?.rank ?? "");
  const [positionTitle, setPositionTitle] = useState(initial?.positionTitle ?? "");
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <div className="content-box__edit" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem" }}>
      <input className="form-input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <input className="form-input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input
        className="form-input"
        placeholder="Grade (9-12)"
        type="number"
        min={9}
        max={12}
        value={grade}
        onChange={(e) => setGrade(e.target.value)}
      />
      <input className="form-input" placeholder="Flight" value={flight} onChange={(e) => setFlight(e.target.value)} />
      <input className="form-input" placeholder="Rank" value={rank} onChange={(e) => setRank(e.target.value)} />
      <input
        className="form-input"
        placeholder="Position title"
        value={positionTitle}
        onChange={(e) => setPositionTitle(e.target.value)}
      />
      <label className="role-chip" style={{ cursor: "pointer" }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      <div className="content-block__actions" style={{ gridColumn: "1 / -1" }}>
        <button
          className="btn-small btn-small--primary"
          disabled={isPending || !firstName.trim() || !lastName.trim()}
          onClick={() =>
            onSubmit({
              firstName,
              lastName,
              grade: grade.trim() ? Number(grade) : null,
              flight,
              rank,
              positionTitle,
              active
            })
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

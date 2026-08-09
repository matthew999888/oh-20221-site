"use client";

import { useId, useMemo, useState } from "react";

type RosterRow = {
  id: string;
  name: string;
  rank: string | null;
  grade: number | string | null;
  flight: string | null;
  positionTitle: string | null;
};

export default function RosterClient({ roster }: { roster: RosterRow[] }) {
  const [search, setSearch] = useState("");
  const [flight, setFlight] = useState("all");
  const searchId = useId();
  const flightId = useId();

  const flights = useMemo(() => {
    const set = new Set<string>();
    for (const c of roster) if (c.flight) set.add(c.flight);
    return Array.from(set).sort();
  }, [roster]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roster.filter((c) => {
      if (flight !== "all" && c.flight !== flight) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.rank ?? "").toLowerCase().includes(q) ||
        (c.positionTitle ?? "").toLowerCase().includes(q)
      );
    });
  }, [roster, search, flight]);

  if (roster.length === 0) {
    return <p className="pub-empty">No active cadets on record yet.</p>;
  }

  const isFiltered = search.trim() !== "" || flight !== "all";

  return (
    <>
      <div className="pub-filters">
        {/* Visible labels rather than aria-label only: label text helps
            everyone, and survives translation tooling. */}
        <div className="pub-field">
          <label className="pub-field__label" htmlFor={searchId}>
            Search roster
          </label>
          <input
            id={searchId}
            className="pub-input"
            type="search"
            placeholder="Name, rank, or position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {flights.length > 1 && (
          <div className="pub-field" style={{ flex: "0 1 220px" }}>
            <label className="pub-field__label" htmlFor={flightId}>
              Flight
            </label>
            <select
              id={flightId}
              className="pub-select"
              value={flight}
              onChange={(e) => setFlight(e.target.value)}
            >
              <option value="all">All flights</option>
              {flights.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Live region so screen reader users hear the result count change
          as they type, instead of silently filtering the table. */}
      <p className="pub-result-count" role="status" aria-live="polite">
        {isFiltered
          ? `Showing ${filtered.length} of ${roster.length} cadets`
          : `${roster.length} cadets`}
      </p>

      {filtered.length === 0 ? (
        <p className="pub-empty">No cadets match your search.</p>
      ) : (
        <div className="pub-tablewrap" tabIndex={0} role="region" aria-label="Cadet roster table">
          <table className="pub-table">
            <caption className="sr-only">
              Active cadets of OH-20221, sorted by flight then last name.
            </caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Rank</th>
                <th scope="col">Grade</th>
                <th scope="col">Flight</th>
                <th scope="col">Position</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <th scope="row" style={{ fontWeight: 500, color: "var(--ink-strong)" }}>
                    {c.name}
                  </th>
                  <td>{c.rank ?? "—"}</td>
                  <td>{c.grade ?? "—"}</td>
                  <td>{c.flight ?? "—"}</td>
                  <td>{c.positionTitle ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

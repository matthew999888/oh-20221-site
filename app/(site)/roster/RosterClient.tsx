"use client";

import { useMemo, useState } from "react";

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
    return <p className="content-block__empty">No active cadets on record yet.</p>;
  }

  return (
    <>
      <div className="roster-filters">
        <input
          className="form-input"
          type="search"
          placeholder="Search by name, rank, or position…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search roster"
        />
        {flights.length > 1 && (
          <select className="form-input" value={flight} onChange={(e) => setFlight(e.target.value)} aria-label="Filter by flight">
            <option value="all">All flights</option>
            {flights.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="content-block__empty">No cadets match your search.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Rank</th>
                <th>Grade</th>
                <th>Flight</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
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
      {search || flight !== "all" ? (
        <p className="roster-filters__count">
          Showing {filtered.length} of {roster.length} cadets
        </p>
      ) : null}
    </>
  );
}

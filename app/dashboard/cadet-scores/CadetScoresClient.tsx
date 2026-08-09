"use client";

import { useMemo, useState } from "react";
import type { QuestionType } from "@/lib/questions";

export type DayScore = {
  id: string;
  date: string;
  question: string;
  type: QuestionType;
  answer: string;
  awarded: number | null;
  max: number;
  graderNote: string | null;
};

export type CadetSummary = {
  id: string;
  name: string;
  email: string;
  rank: string | null;
  flight: string | null;
  grade: number | null;
  answered: number;
  pending: number;
  earned: number;
  possible: number;
  days: DayScore[];
};

function pct(earned: number, possible: number): string {
  if (possible === 0) return "—";
  return `${Math.round((earned / possible) * 100)}%`;
}

export default function CadetScoresClient({ cadets }: { cadets: CadetSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cadets;
    return cadets.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.rank ?? "").toLowerCase().includes(q) ||
        (c.flight ?? "").toLowerCase().includes(q)
    );
  }, [cadets, search]);

  const selected = cadets.find((c) => c.id === selectedId) ?? null;

  if (selected) {
    return (
      <div>
        <button className="btn-small" onClick={() => setSelectedId(null)}>
          &larr; All cadets
        </button>

        <div className="content-block__box" style={{ marginTop: "1rem" }}>
          <h2 style={{ margin: 0 }}>
            {selected.rank ? `${selected.rank} ` : ""}
            {selected.name}
          </h2>
          <p style={{ fontSize: "0.85rem", opacity: 0.75, margin: "0.35rem 0" }}>
            {[selected.flight && `${selected.flight} Flight`, selected.grade && `Grade ${selected.grade}`, selected.email]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p style={{ margin: "0.6rem 0 0" }}>
            <strong>
              {selected.earned} / {selected.possible}
            </strong>{" "}
            points ({pct(selected.earned, selected.possible)}) across {selected.answered} question
            {selected.answered === 1 ? "" : "s"}
            {selected.pending > 0 && (
              <>
                {" "}
                · <em>{selected.pending} awaiting grading</em>
              </>
            )}
          </p>
          {selected.pending > 0 && (
            <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.4rem" }}>
              Ungraded answers are left out of the total rather than counted as zero, so a cadet
              waiting on a grader is not penalised.
            </p>
          )}
        </div>

        {selected.days.length === 0 ? (
          <p className="content-block__empty">This cadet has not answered a daily question yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <caption className="sr-only">Daily question history for {selected.name}</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Question</th>
                  <th scope="col">Answer</th>
                  <th scope="col">Score</th>
                </tr>
              </thead>
              <tbody>
                {selected.days.map((d) => (
                  <tr key={d.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{d.date}</td>
                    <td>{d.question}</td>
                    <td style={{ maxWidth: "22rem", whiteSpace: "pre-wrap" }}>
                      {d.answer || <em>(blank)</em>}
                      {d.graderNote && (
                        <div style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.3rem" }}>
                          Grader: {d.graderNote}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {d.awarded === null ? (
                        <em style={{ opacity: 0.7 }}>Pending</em>
                      ) : (
                        `${d.awarded} / ${d.max}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="form-group" style={{ maxWidth: 360 }}>
        <label className="form-label" htmlFor="cadet-search">
          Search cadets
        </label>
        <input
          id="cadet-search"
          className="form-input"
          type="search"
          placeholder="Name, rank, or flight…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="dash-page__subtitle" role="status" aria-live="polite">
        {filtered.length} of {cadets.length} cadets
      </p>

      {filtered.length === 0 ? (
        <p className="content-block__empty">No cadets match your search.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Cadet</th>
                <th scope="col">Flight</th>
                <th scope="col">Answered</th>
                <th scope="col">Points</th>
                <th scope="col">Rate</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <th scope="row" style={{ fontWeight: 500 }}>
                    {c.rank ? `${c.rank} ` : ""}
                    {c.name}
                  </th>
                  <td>{c.flight ?? "—"}</td>
                  <td>
                    {c.answered}
                    {c.pending > 0 && (
                      <span style={{ opacity: 0.7 }}> ({c.pending} pending)</span>
                    )}
                  </td>
                  <td>
                    {c.earned} / {c.possible}
                  </td>
                  <td>{pct(c.earned, c.possible)}</td>
                  <td>
                    <button className="btn-small" onClick={() => setSelectedId(c.id)}>
                      View days
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

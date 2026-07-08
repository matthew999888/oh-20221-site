"use client";

import { useMemo, useState } from "react";
import { submitEvaluation, deleteEvaluation } from "./_actions";

const SCALE = [
  { value: 2, label: "Poor" },
  { value: 4, label: "Fair" },
  { value: 6, label: "Average" },
  { value: 8, label: "Excellent" },
  { value: 10, label: "Outstanding" }
];

const CRITERIA = [
  {
    id: "promptness",
    label: "Promptness / Quality / Knowledge of Staff Work",
    description:
      "Is the cadet on time for class, details, formations? Is staff work submitted on-time without being reminded? Is staff work of high quality and free of major errors? Is the staff member knowledgeable of required duties and suspenses?"
  },
  {
    id: "working-with-others",
    label: "Working With Others",
    description: "Is the cadet a team player, working well with others to complete tasks? Does the cadet pitch-in and help others?"
  },
  {
    id: "maturity",
    label: "Maturity",
    description: "Does the cadet display mature behavior, both in and out of the AFJROTC environment? Does the cadet set the example for junior cadets?"
  },
  {
    id: "bearing",
    label: "Military Bearing / Appearance",
    description:
      "Does the cadet display good military bearing by wear of the uniform and conduct? Does the cadet lead by example with impeccable uniform and grooming? Is the cadet willing to correct others?"
  },
  {
    id: "attitude",
    label: "Attitude",
    description: "Does the cadet display a positive attitude toward AFJROTC in all situations? Does the cadet have a positive attitude towards the cadet staff, chain of command, and staff duties?"
  }
];

type EvalSummary = {
  id: string;
  cadetName: string;
  cadetRank: string | null;
  cadetFlight: string | null;
  evalDate: string;
  readiness: string | null;
  totalScore: number;
  createdAt: string;
};

/**
 * Reproduces the uploaded "STAFF_CADET_EVALUATIONS.doc". Submitting
 * saves the evaluation to the database (your submission history is
 * listed below) and you can still Print / save as PDF.
 */
export default function StaffEvaluationForm({ initialEvaluations }: { initialEvaluations: EvalSummary[] }) {
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [name, setName] = useState("");
  const [rank, setRank] = useState("");
  const [flight, setFlight] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [readiness, setReadiness] = useState<"ready" | "not-ready" | "">("");
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const total = useMemo(
    () => CRITERIA.reduce((sum, c) => sum + (ratings[c.id] ?? 0), 0),
    [ratings]
  );
  const ratedCount = CRITERIA.filter((c) => ratings[c.id] != null).length;

  function setRating(id: string, value: number) {
    setRatings((prev) => ({ ...prev, [id]: prev[id] === value ? null : value }));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const saved = await submitEvaluation({
        cadetName: name,
        cadetRank: rank,
        cadetFlight: flight,
        evalDate: date,
        readiness,
        ratings,
        comments,
        totalScore: total
      });
      setEvaluations((prev) => [
        {
          id: saved.id,
          cadetName: saved.cadetName,
          cadetRank: saved.cadetRank,
          cadetFlight: saved.cadetFlight,
          evalDate: saved.evalDate.toISOString ? saved.evalDate.toISOString() : String(saved.evalDate),
          readiness: saved.readiness,
          totalScore: saved.totalScore,
          createdAt: saved.createdAt.toISOString ? saved.createdAt.toISOString() : String(saved.createdAt)
        },
        ...prev
      ]);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setEvaluations((prev) => prev.filter((e) => e.id !== id));
    await deleteEvaluation(id);
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Staff Cadet Evaluation</h1>
      <p className="dash-page__subtitle">
        Fill out the evaluation below, then <strong>Submit</strong> to save it, or click Print to print/save as PDF.
      </p>

      <div className="print-sheet">
        <div className="print-sheet__header">
          <h1>STAFF CADET EVALUATION</h1>
        </div>

        <div className="print-row">
          <div className="print-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="print-field">
            <label>Rank</label>
            <input value={rank} onChange={(e) => setRank(e.target.value)} />
          </div>
          <div className="print-field">
            <label>Flight</label>
            <input value={flight} onChange={(e) => setFlight(e.target.value)} />
          </div>
        </div>
        <div className="print-field" style={{ maxWidth: "220px" }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: "2rem", margin: "1rem 0 1.5rem" }}>
          <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={readiness === "ready"} onChange={() => setReadiness((r) => (r === "ready" ? "" : "ready"))} />
            Ready for promotion.
          </label>
          <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={readiness === "not-ready"}
              onChange={() => setReadiness((r) => (r === "not-ready" ? "" : "not-ready"))}
            />
            Not ready for promotion.
          </label>
        </div>

        <table className="eval-table">
          <thead>
            <tr>
              <th></th>
              {SCALE.map((s) => (
                <th key={s.value} className="eval-table__scale">
                  {s.label}
                  <br />({s.value})
                </th>
              ))}
              <th className="eval-table__comment">Comments (required for ratings of Poor or Outstanding)</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.label.toUpperCase()}:</strong> {c.description}
                </td>
                {SCALE.map((s) => (
                  <td key={s.value} className="eval-table__scale">
                    <label>
                      <input
                        type="radio"
                        name={`rating-${c.id}`}
                        checked={ratings[c.id] === s.value}
                        onChange={() => setRating(c.id, s.value)}
                      />
                    </label>
                  </td>
                ))}
                <td className="eval-table__comment">
                  <textarea
                    rows={2}
                    value={comments[c.id] ?? ""}
                    onChange={(e) => setComments((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                </td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>OVERALL RATING</strong>
                <br />
                TOTAL SCORE = {total}
                <br />
                (Add scores for all areas)
              </td>
              <td colSpan={SCALE.length + 1} style={{ textAlign: "center" }}>
                {ratedCount}/{CRITERIA.length} categories rated
              </td>
            </tr>
          </tbody>
        </table>

        <div className="print-signature-row">
          <div>Printed Name and Rank of Evaluator</div>
          <div>Signature of Ratee</div>
        </div>
        <div className="print-signature-row">
          <div>Signature of Evaluator</div>
          <div>Signature of SASI</div>
        </div>
      </div>

      <div className="no-print" style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn-small btn-small--primary" onClick={handleSubmit} disabled={saving}>
          <i className="fa-solid fa-floppy-disk" /> {saving ? "Submitting…" : "Submit"}
        </button>
        <button className="btn-small" onClick={() => window.print()}>
          <i className="fa-solid fa-print" /> Print
        </button>
        {savedMsg && (
          <span style={{ color: "var(--purple-300)", fontSize: "0.85rem" }}>
            <i className="fa-solid fa-circle-check" /> Saved
          </span>
        )}
      </div>

      <section className="dash-card dash-card--full no-print" style={{ marginTop: "2rem" }}>
        <header className="dash-card__header">
          <h2>Your Submitted Evaluations ({evaluations.length})</h2>
        </header>
        {evaluations.length === 0 ? (
          <p className="content-block__empty">No evaluations submitted yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cadet</th>
                <th>Date</th>
                <th>Score</th>
                <th>Readiness</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.cadetName}
                    {e.cadetRank ? ` (${e.cadetRank})` : ""}
                  </td>
                  <td>{new Date(e.evalDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td>{e.totalScore} / 50</td>
                  <td>{e.readiness === "ready" ? "Ready" : e.readiness === "not-ready" ? "Not ready" : "—"}</td>
                  <td>
                    <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(e.id)} aria-label="Delete evaluation">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

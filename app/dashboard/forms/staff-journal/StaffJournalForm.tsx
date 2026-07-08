"use client";

import { useState } from "react";
import { submitJournalEntry, deleteJournalEntry } from "./_actions";

type Entry = {
  id: string;
  period: string;
  jobTitle: string;
  didThisMonth: string;
  comingUp: string;
  barriers: string;
  createdAt: string;
};

/**
 * Reproduces the uploaded "Staff_Entry.docx" — Cadet Staff Journal Entry
 * Sheet. Submitting saves the entry to the database (visible below as
 * your submission history) and you can still Print / save as PDF.
 */
export default function StaffJournalForm({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [period, setPeriod] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [didThisMonth, setDidThisMonth] = useState("");
  const [comingUp, setComingUp] = useState("");
  const [barriers, setBarriers] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      const entry = await submitJournalEntry({ period, jobTitle, didThisMonth, comingUp, barriers });
      setEntries((prev) => [{ ...entry, createdAt: entry.createdAt.toISOString() }, ...prev]);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 4000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    await deleteJournalEntry(id);
  }

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Staff Journal Entry</h1>
      <p className="dash-page__subtitle">
        Fill out the sheet below, then <strong>Submit</strong> to save it (visible in your history below), or click
        Print to print/save as PDF.
      </p>

      <div className="print-sheet">
        <div className="print-sheet__header">
          <p style={{ margin: 0 }}>DEPARTMENT OF AEROSPACE SCIENCE</p>
          <h1>LOGAN HIGH SCHOOL — OH-20221</h1>
          <p>14470 St. Rt. 328 · Logan, OH 43138 · (740) 385-2069</p>
          <h1 style={{ marginTop: "0.75rem" }}>CADET STAFF JOURNAL ENTRY SHEET</h1>
          <p><em>(Must be submitted by the 5th of each month)</em></p>
        </div>

        <div className="print-row">
          <div className="print-field">
            <label>Journal Entry Time Period (e.g. March 2025)</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="print-field">
            <label>Staff Job Title</label>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>

        <div className="print-field">
          <label>List very specifically what you did this month in your staff job</label>
          <textarea rows={6} value={didThisMonth} onChange={(e) => setDidThisMonth(e.target.value)} />
        </div>

        <div className="print-field">
          <label>What things are coming up in the future?</label>
          <textarea rows={4} value={comingUp} onChange={(e) => setComingUp(e.target.value)} />
        </div>

        <div className="print-field">
          <label>Barriers or problems with your job?</label>
          <textarea rows={4} value={barriers} onChange={(e) => setBarriers(e.target.value)} />
        </div>

        <p style={{ textAlign: "center", fontWeight: 700, marginTop: "1.5rem" }}>
          **TURN THIS JOURNAL ENTRY INTO YOUR REPORTING SUPERVISOR**
        </p>
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
          <h2>Your Submitted Entries ({entries.length})</h2>
        </header>
        {entries.length === 0 ? (
          <p className="content-block__empty">No journal entries submitted yet.</p>
        ) : (
          <ul className="dash-list" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
            {entries.map((e) => (
              <li key={e.id} style={{ display: "block", borderBottom: "1px solid rgba(139,92,200,0.15)", paddingBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong>
                    {e.period} — {e.jobTitle}
                  </strong>
                  <button className="icon-btn icon-btn--danger" onClick={() => handleDelete(e.id)} aria-label="Delete entry">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
                <p className="dash-list__meta">
                  Submitted {new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "var(--text-200)" }}>{e.didThisMonth}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

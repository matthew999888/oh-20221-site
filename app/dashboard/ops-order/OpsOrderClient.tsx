"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { updateOpsOrderStatus } from "./_actions";

type Difficulty = "full" | "75" | "50" | "25" | "first" | "blanks";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "full", label: "Full Text" },
  { value: "75", label: "75%" },
  { value: "50", label: "50%" },
  { value: "25", label: "25%" },
  { value: "first", label: "First Letters" },
  { value: "blanks", label: "All Blanks" }
];

function isBlanked(index: number, difficulty: Difficulty) {
  switch (difficulty) {
    case "full":
      return false;
    case "75":
      return index % 4 === 3; // ~25% blanked
    case "50":
      return index % 2 === 1; // ~50% blanked
    case "25":
      return index % 4 !== 3; // ~75% blanked
    case "first":
    case "blanks":
      return true;
    default:
      return false;
  }
}

function HonorCodeWord({ word, index, difficulty }: { word: string; index: number; difficulty: Difficulty }) {
  const blank = isBlanked(index, difficulty);
  if (!blank) return <span className="honor-code__word">{word}</span>;

  if (difficulty === "first") {
    const first = word.match(/[a-zA-Z]/)?.[0] ?? "";
    return (
      <span className="honor-code__word">
        {first}
        <span className="honor-code__blank" style={{ width: `${Math.max(word.length - 1, 1) * 0.6}em` }} />
      </span>
    );
  }

  return (
    <span className="honor-code__word">
      <span className="honor-code__blank" style={{ width: `${Math.max(word.length, 2) * 0.62}em` }} />
    </span>
  );
}

type EventLite = { id: string; title: string; startsAt: string; location: string | null };
type MessageLite = { id: string; title: string; body: string; publishAt: string };

export default function OpsOrderClient({
  editable,
  status,
  upcomingEvents,
  ldrThisWeek,
  staffMessages
}: {
  editable: boolean;
  status: {
    uniformOfTheDay: string;
    ptDay: string;
    ptDetails: string;
    honorCode: string;
    honorCodeTitle: string;
    honorCodeLead: string;
  };
  upcomingEvents: EventLite[];
  ldrThisWeek: EventLite[];
  staffMessages: MessageLite[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("full");
  const [editingStatus, setEditingStatus] = useState(false);
  const [uniform, setUniform] = useState(status.uniformOfTheDay);
  const [ptDay, setPtDay] = useState(status.ptDay);
  const [ptDetails, setPtDetails] = useState(status.ptDetails);
  const [honorCode, setHonorCode] = useState(status.honorCode);
  const [honorCodeTitle, setHonorCodeTitle] = useState(status.honorCodeTitle);
  const [honorCodeLead, setHonorCodeLead] = useState(status.honorCodeLead);
  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const words = useMemo(() => honorCode.split(" ").filter(Boolean), [honorCode]);
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    []
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setSlide((s) => Math.min(1, s + 1));
      if (e.key === "ArrowLeft") setSlide((s) => Math.max(0, s - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }

  async function saveStatus() {
    setSaving(true);
    try {
      await updateOpsOrderStatus({ uniformOfTheDay: uniform, ptDay, ptDetails, honorCode, honorCodeTitle, honorCodeLead });
      setEditingStatus(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`dash-page oo-shell${isFullscreen ? " oo-shell--fullscreen" : ""}`} ref={containerRef}>
      <div className="oo-header">
        <button
          type="button"
          className="btn-small oo-fullscreen-toggle"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          <i className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`} />{" "}
          {isFullscreen ? "Exit Full Screen" : "Full Screen"}
        </button>
        <p className="oo-header__eyebrow">OH-20221 AFJROTC</p>
        <h1 className="oo-header__title">Daily Operations Order</h1>
        <p className="oo-header__date">{todayLabel}</p>
      </div>

      {slide === 0 ? (
        <>
          <section className="dash-card dash-card--full oo-honorcode">
            {editingStatus ? (
              <input
                className="form-input"
                value={honorCodeTitle}
                onChange={(e) => setHonorCodeTitle(e.target.value)}
                style={{ textAlign: "center", marginBottom: "0.5rem", fontWeight: 700 }}
              />
            ) : (
              <h2 className="oo-honorcode__title">{honorCodeTitle}</h2>
            )}
            <div className="oo-honorcode__rule" />
            {editingStatus ? (
              <input
                className="form-input"
                value={honorCodeLead}
                onChange={(e) => setHonorCodeLead(e.target.value)}
                style={{ textAlign: "center", marginBottom: "0.75rem" }}
              />
            ) : (
              <p className="oo-honorcode__lead">{honorCodeLead}</p>
            )}
            {editingStatus ? (
              <textarea
                className="form-input"
                rows={2}
                value={honorCode}
                onChange={(e) => setHonorCode(e.target.value)}
                style={{ marginBottom: "0.5rem" }}
              />
            ) : (
              <p className="honor-code">
                {words.map((w, i) => (
                  <HonorCodeWord key={i} word={w} index={i} difficulty={difficulty} />
                ))}
              </p>
            )}
            <div className="oo-honorcode__rule" />
            <div className="oo-difficulty">
              <span className="oo-difficulty__label">Difficulty Level</span>
              <div className="oo-difficulty__options">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`btn-small${difficulty === d.value ? " btn-small--primary" : ""}`}
                    onClick={() => setDifficulty(d.value)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="oo-status-grid">
            <section className="dash-card oo-status-box">
              <header className="dash-card__header">
                <h2><i className="fa-solid fa-shirt" /> Uniform of the Day</h2>
              </header>
              {!editingStatus ? (
                <p className="oo-status-box__value oo-status-box__value--orange">{uniform || "TBD"}</p>
              ) : (
                <input className="form-input" value={uniform} onChange={(e) => setUniform(e.target.value)} placeholder="e.g. ABUs" />
              )}
            </section>

            <section className="dash-card oo-status-box">
              <header className="dash-card__header">
                <h2><i className="fa-solid fa-person-running" /> PT This Week</h2>
              </header>
              {!editingStatus ? (
                <>
                  <p className="oo-status-box__value oo-status-box__value--green">{ptDetails || "TBD"}</p>
                  {ptDay && <p className="oo-status-box__sub">{ptDay}</p>}
                </>
              ) : (
                <>
                  <input className="form-input" value={ptDetails} onChange={(e) => setPtDetails(e.target.value)} placeholder="e.g. Formation PT" />
                  <input className="form-input" style={{ marginTop: "0.4rem" }} value={ptDay} onChange={(e) => setPtDay(e.target.value)} placeholder="e.g. Friday 7/10" />
                </>
              )}
            </section>
          </div>

          {editable && (
            <div className="content-block__actions">
              {editingStatus ? (
                <>
                  <button className="btn-small btn-small--primary" onClick={saveStatus} disabled={saving}>
                    <i className="fa-solid fa-check" /> {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    className="btn-small"
                    onClick={() => {
                      setUniform(status.uniformOfTheDay);
                      setPtDay(status.ptDay);
                      setPtDetails(status.ptDetails);
                      setHonorCode(status.honorCode);
                      setHonorCodeTitle(status.honorCodeTitle);
                      setHonorCodeLead(status.honorCodeLead);
                      setEditingStatus(false);
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn-small" onClick={() => setEditingStatus(true)}>
                  <i className="fa-solid fa-pen" /> Edit honor code / uniform / PT
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="oo-status-grid oo-status-grid--three">
          <section className="dash-card oo-panel">
            <header className="dash-card__header">
              <h2><i className="fa-solid fa-calendar-days" /> Upcoming Events</h2>
            </header>
            {upcomingEvents.length === 0 ? (
              <p className="content-block__empty">No upcoming events in the next 2 weeks</p>
            ) : (
              <ul className="oo-panel__list">
                {upcomingEvents.map((e) => (
                  <li key={e.id}>
                    <strong>{e.title}</strong>
                    <span>{new Date(e.startsAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    {e.location && <span className="oo-panel__loc">{e.location}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-card oo-panel">
            <header className="dash-card__header">
              <h2><i className="fa-solid fa-bullseye" /> LDR Schedule <span className="oo-panel__tag">This Week</span></h2>
            </header>
            {ldrThisWeek.length === 0 ? (
              <p className="content-block__empty">No LDR activities this week</p>
            ) : (
              <ul className="oo-panel__list">
                {ldrThisWeek.map((e) => (
                  <li key={e.id}>
                    <strong>{e.title}</strong>
                    <span>{new Date(e.startsAt).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-card oo-panel">
            <header className="dash-card__header">
              <h2><i className="fa-solid fa-bullhorn" /> Staff Messages</h2>
            </header>
            {staffMessages.length === 0 ? (
              <p className="content-block__empty">No staff messages posted</p>
            ) : (
              <ul className="oo-panel__list oo-panel__list--messages">
                {staffMessages.map((m) => (
                  <li key={m.id}>
                    <strong>{m.title}</strong>
                    <p>{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <div className="oo-nav">
        <button className="btn-small" onClick={() => setSlide(0)} disabled={slide === 0}>
          <i className="fa-solid fa-arrow-left" /> Previous
        </button>
        <span className="oo-nav__hint">(Use arrow keys)</span>
        <button className="btn-small" onClick={() => setSlide(1)} disabled={slide === 1}>
          Next <i className="fa-solid fa-arrow-right" />
        </button>
      </div>
    </div>
  );
}

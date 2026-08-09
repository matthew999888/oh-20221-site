"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { gradeDailyAnswer } from "@/app/dashboard/_actions/questions";

export type PendingAnswer = {
  id: string;
  cadetName: string;
  questionText: string;
  answerKey: string | null;
  maxPoints: number;
  writtenAnswer: string;
  date: string;
};

/** Written answers awaiting a human. Multiple choice never lands here. */
export default function GradeQueue({ initial }: { initial: PendingAnswer[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [points, setPoints] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (initial.length === 0) {
    return <p className="content-block__empty">Nothing waiting to be graded.</p>;
  }

  return (
    <div>
      <p className="dash-page__subtitle">
        {initial.length} written answer{initial.length === 1 ? "" : "s"} waiting. Multiple choice
        is graded automatically and never appears here.
      </p>

      {error && (
        <p role="alert" style={{ color: "#ea5c73", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}

      {initial.map((a) => (
        <div className="content-block__box" key={a.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <strong>{a.cadetName}</strong>
            <span style={{ fontSize: "0.8rem", opacity: 0.7, whiteSpace: "nowrap" }}>{a.date}</span>
          </div>
          <p style={{ fontSize: "0.86rem", opacity: 0.8, margin: "0.3rem 0" }}>{a.questionText}</p>

          <p style={{ whiteSpace: "pre-wrap", margin: "0.6rem 0", padding: "0.7rem", background: "rgba(255,255,255,0.03)" }}>
            {a.writtenAnswer}
          </p>

          {a.answerKey && (
            <p style={{ fontSize: "0.82rem", opacity: 0.75 }}>
              <strong>Answer key:</strong> {a.answerKey}
            </p>
          )}

          <label className="form-label" htmlFor={`pts-${a.id}`}>
            Points (0&ndash;{a.maxPoints})
          </label>
          <input
            id={`pts-${a.id}`}
            className="form-input"
            type="number"
            min={0}
            max={a.maxPoints}
            value={points[a.id] ?? ""}
            onChange={(e) =>
              setPoints({ ...points, [a.id]: parseInt(e.target.value, 10) })
            }
          />

          <label className="form-label" htmlFor={`note-${a.id}`}>
            Note to the cadet (optional)
          </label>
          <input
            id={`note-${a.id}`}
            className="form-input"
            value={notes[a.id] ?? ""}
            onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
          />

          <div className="content-block__actions">
            <button
              className="btn-small btn-small--primary"
              disabled={pending || !Number.isInteger(points[a.id])}
              onClick={() =>
                start(async () => {
                  try {
                    await gradeDailyAnswer(a.id, points[a.id], notes[a.id] ?? "");
                    router.refresh();
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not save that grade.");
                  }
                })
              }
            >
              Save grade
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

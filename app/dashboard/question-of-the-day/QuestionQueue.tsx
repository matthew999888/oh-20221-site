"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import QuestionEditor from "@/components/dashboard/QuestionEditor";
import {
  EMPTY_QUESTION,
  QUESTION_TYPES,
  validateQuestion,
  type QuestionDraft,
  type QuestionType
} from "@/lib/questions";
import { deleteDailyQuestion, saveDailyQuestion } from "@/app/dashboard/_actions/questions";

export type QueuedQuestion = QuestionDraft & {
  id: string;
  scheduledFor: string;
  answerCount: number;
  isToday: boolean;
};

/** Next date with no question queued — the sensible default for a new one. */
function nextFreeDate(taken: string[]): string {
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const iso = d.toISOString().slice(0, 10);
    if (!taken.includes(iso)) return iso;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return new Date().toISOString().slice(0, 10);
}

export default function QuestionQueue({ initial }: { initial: QueuedQuestion[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<{ id: string | null; date: string; q: QuestionDraft } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const typeLabel = (t: QuestionType) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? t;

  function save() {
    if (!draft) return;
    const problem = validateQuestion(draft.q);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    start(async () => {
      try {
        await saveDailyQuestion(draft.id, draft.date, draft.q);
        setDraft(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save that question.");
      }
    });
  }

  return (
    <div>
      <p className="dash-page__subtitle">
        Queue as far ahead as you like. Each date can hold one question, and saving an existing
        date replaces it.
      </p>

      {initial.length === 0 && (
        <p className="content-block__empty">
          Nothing queued. Add a question so one is ready for tomorrow.
        </p>
      )}

      {initial.map((q) => (
        <div className="content-block__box" key={q.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <strong>{q.questionText}</strong>
            <span style={{ whiteSpace: "nowrap", fontSize: "0.82rem", opacity: 0.75 }}>
              {q.scheduledFor}
              {q.isToday && " · today"}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", opacity: 0.75, margin: "0.35rem 0" }}>
            {typeLabel(q.type)} · {q.points} pt{q.points === 1 ? "" : "s"} · {q.answerCount}{" "}
            answer{q.answerCount === 1 ? "" : "s"}
          </p>
          <div className="content-block__actions">
            <button
              className="btn-small"
              disabled={pending}
              onClick={() => {
                setError(null);
                setDraft({ id: q.id, date: q.scheduledFor, q });
              }}
            >
              Edit
            </button>
            <button
              className="btn-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await deleteDailyQuestion(q.id);
                  router.refresh();
                })
              }
            >
              Delete
            </button>
          </div>
          {q.answerCount > 0 && (
            <p style={{ fontSize: "0.78rem", opacity: 0.7 }}>
              Cadets have already answered this one — editing it will not re-grade their answers.
            </p>
          )}
        </div>
      ))}

      {draft ? (
        <div className="content-block__box">
          <label className="form-label" htmlFor="qotd-date">
            Date this question runs
          </label>
          <input
            id="qotd-date"
            className="form-input"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />

          <QuestionEditor
            value={draft.q}
            onChange={(q) => setDraft({ ...draft, q })}
            idPrefix="qotd-q"
          />

          {error && (
            <p role="alert" style={{ color: "#ea5c73", fontSize: "0.85rem", marginTop: "0.6rem" }}>
              {error}
            </p>
          )}
          <div className="content-block__actions">
            <button className="btn-small btn-small--primary" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button className="btn-small" onClick={() => setDraft(null)} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn-small btn-small--primary"
          onClick={() => {
            setError(null);
            setDraft({
              id: null,
              date: nextFreeDate(initial.map((q) => q.scheduledFor)),
              q: { ...EMPTY_QUESTION }
            });
          }}
        >
          Queue a question
        </button>
      )}
    </div>
  );
}

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
import {
  deleteTestQuestion,
  reorderTestQuestion,
  saveTestQuestion
} from "@/app/dashboard/_actions/questions";

export type BuilderQuestion = QuestionDraft & { id: string; order: number };

export default function TestBuilder({
  rank,
  ranks,
  initial
}: {
  rank: number;
  ranks: { value: number; label: string }[];
  initial: BuilderQuestion[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState<{ id: string | null; q: QuestionDraft } | null>(null);
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
        const order = draft.id
          ? (rows.find((r) => r.id === draft.id)?.order ?? rows.length)
          : rows.length;
        await saveTestQuestion(rank, draft.id, draft.q, order);
        setDraft(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save that question.");
      }
    });
  }

  return (
    <div>
      <div className="form-group" style={{ maxWidth: 380 }}>
        <label className="form-label" htmlFor="rank-select">
          Rank test
        </label>
        <select
          id="rank-select"
          className="form-input"
          value={rank}
          onChange={(e) => router.push(`/dashboard/promotions/manage?rank=${e.target.value}`)}
        >
          {ranks.map((r) => (
            <option key={r.value} value={r.value}>
              {r.value}. {r.label}
            </option>
          ))}
        </select>
      </div>

      <p className="dash-page__subtitle">
        {rows.length} question{rows.length === 1 ? "" : "s"} ·{" "}
        {rows.reduce((sum, r) => sum + r.points, 0)} points total
      </p>

      {rows.map((q, i) => (
        <div className="content-block__box" key={q.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <strong>
              {i + 1}. {q.questionText}
            </strong>
            <span style={{ whiteSpace: "nowrap", opacity: 0.7, fontSize: "0.85rem" }}>
              {q.points} pt{q.points === 1 ? "" : "s"}
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", opacity: 0.75, margin: "0.35rem 0" }}>
            {typeLabel(q.type)}
            {q.type === "multiple_choice" && ` · correct: ${q.correctChoice}`}
          </p>

          {q.type === "multiple_choice" && (
            <ul style={{ margin: "0.4rem 0", paddingLeft: "1.2rem", fontSize: "0.86rem" }}>
              {(["A", "B", "C", "D"] as const).map((k) => (
                <li
                  key={k}
                  style={{
                    opacity: q.correctChoice === k ? 1 : 0.7,
                    fontWeight: q.correctChoice === k ? 700 : 400
                  }}
                >
                  {k}. {q[`choice${k}` as const]}
                </li>
              ))}
            </ul>
          )}

          <div className="content-block__actions">
            <button
              className="btn-small"
              disabled={pending}
              onClick={() => {
                setError(null);
                setDraft({ id: q.id, q });
              }}
            >
              Edit
            </button>
            <button
              className="btn-small"
              disabled={pending || i === 0}
              onClick={() =>
                start(async () => {
                  await reorderTestQuestion(q.id, "up");
                  router.refresh();
                })
              }
            >
              Move up
            </button>
            <button
              className="btn-small"
              disabled={pending || i === rows.length - 1}
              onClick={() =>
                start(async () => {
                  await reorderTestQuestion(q.id, "down");
                  router.refresh();
                })
              }
            >
              Move down
            </button>
            <button
              className="btn-small"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await deleteTestQuestion(q.id);
                  setRows((r) => r.filter((x) => x.id !== q.id));
                  router.refresh();
                })
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {draft ? (
        <div className="content-block__box">
          <QuestionEditor
            value={draft.q}
            onChange={(q) => setDraft({ ...draft, q })}
            idPrefix="test-q"
          />
          {error && (
            <p role="alert" style={{ color: "#ea5c73", fontSize: "0.85rem", marginTop: "0.6rem" }}>
              {error}
            </p>
          )}
          <div className="content-block__actions">
            <button className="btn-small btn-small--primary" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save question"}
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
            setDraft({ id: null, q: { ...EMPTY_QUESTION } });
          }}
        >
          Add question
        </button>
      )}
    </div>
  );
}

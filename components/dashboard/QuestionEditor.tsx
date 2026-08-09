"use client";

import { QUESTION_TYPES, type QuestionDraft, type QuestionType } from "@/lib/questions";

/**
 * Google-Forms-style question editor, shared by the promotion test
 * builder and the Question of the Day.
 *
 * The fields shown follow the selected type: choices only for multiple
 * choice, an answer key only for written answers. Values for hidden
 * fields are kept in state rather than cleared, so toggling type by
 * accident does not destroy work.
 */
export default function QuestionEditor({
  value,
  onChange,
  idPrefix
}: {
  value: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
  idPrefix: string;
}) {
  const set = <K extends keyof QuestionDraft>(key: K, v: QuestionDraft[K]) =>
    onChange({ ...value, [key]: v });

  const choiceKeys = ["A", "B", "C", "D"] as const;
  const choiceField = {
    A: "choiceA",
    B: "choiceB",
    C: "choiceC",
    D: "choiceD"
  } as const;

  return (
    <div>
      <label className="form-label" htmlFor={`${idPrefix}-text`}>
        Question
      </label>
      <textarea
        id={`${idPrefix}-text`}
        className="form-input"
        rows={3}
        value={value.questionText}
        onChange={(e) => set("questionText", e.target.value)}
        placeholder="What are the three core values of the U.S. Air Force?"
      />

      <label className="form-label" htmlFor={`${idPrefix}-type`}>
        Answer type
      </label>
      <select
        id={`${idPrefix}-type`}
        className="form-input"
        value={value.type}
        onChange={(e) => set("type", e.target.value as QuestionType)}
      >
        {QUESTION_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: "0.35rem 0 0.75rem" }}>
        {QUESTION_TYPES.find((t) => t.value === value.type)?.hint}
      </p>

      {value.type === "multiple_choice" && (
        <fieldset style={{ border: 0, padding: 0, margin: "0 0 0.75rem" }}>
          <legend className="form-label" style={{ padding: 0 }}>
            Options — select the correct one
          </legend>
          {choiceKeys.map((k) => (
            <div
              key={k}
              style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}
            >
              <input
                type="radio"
                name={`${idPrefix}-correct`}
                id={`${idPrefix}-correct-${k}`}
                checked={value.correctChoice === k}
                onChange={() => set("correctChoice", k)}
                style={{ width: 18, height: 18, flexShrink: 0 }}
              />
              <label htmlFor={`${idPrefix}-correct-${k}`} className="sr-only">
                Mark option {k} correct
              </label>
              <span style={{ width: "1.2rem", opacity: 0.7, fontWeight: 700 }}>{k}</span>
              <input
                className="form-input"
                style={{ margin: 0 }}
                aria-label={`Option ${k} text`}
                value={value[choiceField[k]]}
                onChange={(e) => set(choiceField[k], e.target.value)}
              />
            </div>
          ))}
        </fieldset>
      )}

      {value.type !== "multiple_choice" && (
        <>
          <label className="form-label" htmlFor={`${idPrefix}-key`}>
            Answer key / grading notes (optional)
          </label>
          <textarea
            id={`${idPrefix}-key`}
            className="form-input"
            rows={value.type === "long_answer" ? 4 : 2}
            value={value.answerKey}
            onChange={(e) => set("answerKey", e.target.value)}
            placeholder="What a full-credit answer should mention."
          />
          <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: "0.35rem 0 0.75rem" }}>
            Shown only to whoever grades this — never to cadets. Written answers are not
            auto-graded: matching free text would mark correct answers wrong over spelling and
            phrasing.
          </p>
        </>
      )}

      <label className="form-label" htmlFor={`${idPrefix}-points`}>
        Points
      </label>
      <input
        id={`${idPrefix}-points`}
        className="form-input"
        type="number"
        min={1}
        value={value.points}
        onChange={(e) => set("points", parseInt(e.target.value, 10) || 1)}
      />
    </div>
  );
}

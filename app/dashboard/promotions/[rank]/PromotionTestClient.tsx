"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { submitPromotionTest } from "./_actions";

type Question = {
  id: string;
  order: number;
  questionText: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
};

export default function PromotionTestClient({
  rank,
  questions,
  nextEligibleAt,
  lastScore
}: {
  rank: number;
  questions: Question[];
  nextEligibleAt: string | null;
  lastScore: { score: number; total: number } | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  const answeredCount = Object.keys(answers).length;
  const locked = Boolean(nextEligibleAt) && !result;

  const nextEligibleLabel = useMemo(() => {
    if (!nextEligibleAt) return null;
    return new Date(nextEligibleAt).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });
  }, [nextEligibleAt]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (answeredCount < questions.length) {
      setError(`Please answer every question — you've answered ${answeredCount} of ${questions.length}.`);
      return;
    }

    setSubmitting(true);
    const res = await submitPromotionTest(rank, answers);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    setResult({ score: res.score, total: res.total });
  }

  if (locked) {
    return (
      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Test Locked</h2>
        </header>
        <p className="content-block__empty">
          <i className="fa-solid fa-lock" aria-hidden="true" /> You can only take this test once every 7 days.
          You're eligible again on <strong>{nextEligibleLabel}</strong>.
        </p>
        {lastScore && (
          <p className="content-block__empty">
            Your last score: <strong>{lastScore.score} / {lastScore.total}</strong>
          </p>
        )}
        <Link href="/dashboard/promotions" className="btn-ghost">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to all tests
        </Link>
      </section>
    );
  }

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <section className="dash-card dash-card--full">
        <header className="dash-card__header">
          <h2>Test Submitted</h2>
        </header>
        <p className="content-block__empty">
          <i className="fa-solid fa-circle-check" aria-hidden="true" /> You scored{" "}
          <strong>
            {result.score} / {result.total}
          </strong>{" "}
          ({pct}%).
        </p>
        <p className="content-block__empty">You can take this test again in 7 days.</p>
        <Link href="/dashboard/promotions" className="btn-ghost">
          <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to all tests
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <section className="dash-card dash-card--full" style={{ marginBottom: "1rem" }}>
        <header className="dash-card__header">
          <h2>
            Progress: {answeredCount} / {questions.length} answered
          </h2>
        </header>
      </section>

      {questions.map((q, i) => (
        <section className="dash-card dash-card--full" key={q.id} style={{ marginBottom: "1rem" }}>
          <header className="dash-card__header">
            <h2>
              Question {i + 1} of {questions.length}
            </h2>
          </header>
          <p style={{ marginBottom: "0.75rem", fontWeight: 600, color: "var(--text-100)" }}>{q.questionText}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const text = { A: q.choiceA, B: q.choiceB, C: q.choiceC, D: q.choiceD }[letter];
              const inputId = `${q.id}-${letter}`;
              return (
                <label
                  key={letter}
                  htmlFor={inputId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "8px",
                    border:
                      answers[q.id] === letter
                        ? "1px solid var(--purple-400)"
                        : "1px solid rgba(91, 45, 158, 0.2)",
                    background: answers[q.id] === letter ? "var(--bg-card-hover)" : "var(--bg-section)",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="radio"
                    id={inputId}
                    name={q.id}
                    value={letter}
                    checked={answers[q.id] === letter}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                  />
                  <span>
                    <strong>{letter}.</strong> {text}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      {error && (
        <div className="auth-status error" style={{ marginBottom: "1rem" }}>
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Test"}
      </button>
    </form>
  );
}

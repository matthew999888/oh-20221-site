"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { QuestionType } from "@/lib/questions";
import { answerDailyQuestion } from "@/app/dashboard/_actions/questions";

type Today = {
  id: string;
  questionText: string;
  type: QuestionType;
  choiceA: string | null;
  choiceB: string | null;
  choiceC: string | null;
  choiceD: string | null;
  points: number;
};

type Answered = {
  selectedChoice: string | null;
  writtenAnswer: string | null;
  awardedPoints: number | null;
  maxPoints: number;
  graderNote: string | null;
};

export default function AnswerToday({
  question,
  alreadyAnswered
}: {
  question: Today | null;
  alreadyAnswered: Answered | null;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState("");
  const [written, setWritten] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!question) {
    return (
      <div className="content-block__box">
        <p className="content-block__empty">
          No question is scheduled for today. Check back tomorrow.
        </p>
      </div>
    );
  }

  if (alreadyAnswered) {
    const graded = alreadyAnswered.awardedPoints !== null;
    return (
      <div className="content-block__box">
        <strong>{question.questionText}</strong>
        <p style={{ margin: "0.6rem 0", opacity: 0.85 }}>
          Your answer:{" "}
          {alreadyAnswered.selectedChoice ?? alreadyAnswered.writtenAnswer ?? "(blank)"}
        </p>
        <p style={{ fontSize: "0.9rem" }}>
          {graded ? (
            <>
              Scored <strong>{alreadyAnswered.awardedPoints}</strong> of{" "}
              {alreadyAnswered.maxPoints}
            </>
          ) : (
            <em>Submitted — waiting to be graded by staff.</em>
          )}
        </p>
        {alreadyAnswered.graderNote && (
          <p style={{ fontSize: "0.88rem", opacity: 0.8, marginTop: "0.5rem" }}>
            Note from grader: {alreadyAnswered.graderNote}
          </p>
        )}
      </div>
    );
  }

  const isMc = question.type === "multiple_choice";
  const choices = [
    ["A", question.choiceA],
    ["B", question.choiceB],
    ["C", question.choiceC],
    ["D", question.choiceD]
  ] as const;

  function submit() {
    if (isMc && !choice) {
      setError("Pick an answer.");
      return;
    }
    if (!isMc && !written.trim()) {
      setError("Write an answer.");
      return;
    }
    setError(null);
    start(async () => {
      try {
        await answerDailyQuestion(question!.id, isMc ? choice : null, isMc ? null : written);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not submit your answer.");
      }
    });
  }

  return (
    <div className="content-block__box">
      <strong>{question.questionText}</strong>
      <p style={{ fontSize: "0.82rem", opacity: 0.7, margin: "0.35rem 0 0.9rem" }}>
        Worth {question.points} point{question.points === 1 ? "" : "s"} · one attempt
      </p>

      {isMc ? (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">Choose your answer</legend>
          {choices.map(([k, text]) =>
            text ? (
              <div
                key={k}
                style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.5rem" }}
              >
                <input
                  type="radio"
                  name="qotd"
                  id={`qotd-${k}`}
                  value={k}
                  checked={choice === k}
                  onChange={() => setChoice(k)}
                  style={{ width: 18, height: 18 }}
                />
                <label htmlFor={`qotd-${k}`}>
                  <strong style={{ marginRight: "0.4rem" }}>{k}.</strong>
                  {text}
                </label>
              </div>
            ) : null
          )}
        </fieldset>
      ) : (
        <>
          <label className="form-label" htmlFor="qotd-written">
            Your answer
          </label>
          <textarea
            id="qotd-written"
            className="form-input"
            rows={question.type === "long_answer" ? 8 : 3}
            value={written}
            onChange={(e) => setWritten(e.target.value)}
          />
        </>
      )}

      {error && (
        <p role="alert" style={{ color: "#ea5c73", fontSize: "0.85rem", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}

      <div className="content-block__actions">
        <button className="btn-small btn-small--primary" onClick={submit} disabled={pending}>
          {pending ? "Submitting…" : "Submit answer"}
        </button>
      </div>
      <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
        You can only answer once, so check it before you submit.
      </p>
    </div>
  );
}

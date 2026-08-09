/* =====================================================================
   Shared question shape
   ---------------------------------------------------------------------
   The promotion test and the Question of the Day ask the same kinds of
   question, so they share one editor component and one grading rule.
   Keeping that in a single module is what stops the two features
   drifting into slightly different behaviour.
===================================================================== */

export type QuestionType = "multiple_choice" | "short_answer" | "long_answer";

export const QUESTION_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
    hint: "Four options, one correct. Graded automatically the moment it is submitted."
  },
  {
    value: "short_answer",
    label: "Short answer",
    hint: "A word or a sentence. Needs a person to grade it."
  },
  {
    value: "long_answer",
    label: "Long answer",
    hint: "A paragraph or more. Needs a person to grade it."
  }
];

/** Free-text questions cannot be graded on submit. */
export function needsManualGrading(type: QuestionType): boolean {
  return type !== "multiple_choice";
}

export type QuestionDraft = {
  questionText: string;
  type: QuestionType;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correctChoice: string; // "A" | "B" | "C" | "D"
  answerKey: string;
  points: number;
};

export const EMPTY_QUESTION: QuestionDraft = {
  questionText: "",
  type: "multiple_choice",
  choiceA: "",
  choiceB: "",
  choiceC: "",
  choiceD: "",
  correctChoice: "A",
  answerKey: "",
  points: 1
};

/**
 * Validates a draft before it is saved. Returns a human-readable
 * problem, or null when the question is usable.
 *
 * This runs on the server as well as the client: a half-finished
 * multiple-choice question — options blank, or no correct answer marked
 * — is unanswerable, and it would only be discovered by the cadet
 * sitting the test.
 */
export function validateQuestion(q: QuestionDraft): string | null {
  if (!q.questionText.trim()) return "Enter the question.";
  if (!Number.isInteger(q.points) || q.points < 1) return "Points must be a whole number of 1 or more.";

  if (q.type === "multiple_choice") {
    const filled = [q.choiceA, q.choiceB, q.choiceC, q.choiceD].map((c) => c.trim());
    if (filled.some((c) => !c)) return "Multiple choice questions need all four options filled in.";
    if (!["A", "B", "C", "D"].includes(q.correctChoice)) return "Mark which option is correct.";
  }

  return null;
}

/** Auto-grade. Written answers always return null — a human grades those. */
export function autoGrade(
  type: QuestionType,
  correctChoice: string | null,
  selectedChoice: string | null,
  points: number
): number | null {
  if (needsManualGrading(type)) return null;
  if (!correctChoice || !selectedChoice) return 0;
  return selectedChoice === correctChoice ? points : 0;
}

/**
 * Today's date at UTC midnight.
 *
 * DailyQuestion.scheduledFor is a DATE column, so it must be compared
 * against a date with a zeroed time. Using `new Date()` directly would
 * make "today's question" depend on the server's clock time of day.
 */
export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Parse a yyyy-mm-dd input value into a UTC-midnight Date. */
export function parseDateInput(value: string): Date | null {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Format a Date as yyyy-mm-dd for a date input, in UTC. */
export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions-server";
import { prisma } from "@/lib/prisma";
import { toDateInput } from "@/lib/questions";
import CadetScoresClient, { type CadetSummary, type DayScore } from "./CadetScoresClient";

export default async function CadetScoresPage() {
  await requirePagePermission("cadet-scores", "view");

  // Every cadet with a portal account, plus their daily-question
  // history. Ordered by name so the list is stable between loads.
  const users = await prisma.user.findMany({
    where: { status: "approved" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      rosterEntry: { select: { rank: true, flight: true, grade: true } },
      dailyQuestionAnswers: {
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          awardedPoints: true,
          selectedChoice: true,
          writtenAnswer: true,
          graderNote: true,
          submittedAt: true,
          question: {
            select: { questionText: true, points: true, scheduledFor: true, type: true }
          }
        }
      }
    }
  });

  const cadets: CadetSummary[] = users.map((u) => {
    const days: DayScore[] = u.dailyQuestionAnswers.map((a) => ({
      id: a.id,
      date: toDateInput(a.question.scheduledFor),
      question: a.question.questionText,
      type: a.question.type,
      answer: a.selectedChoice ?? a.writtenAnswer ?? "",
      awarded: a.awardedPoints,
      max: a.question.points,
      graderNote: a.graderNote
    }));

    // Ungraded answers are excluded from both sides of the ratio —
    // counting them as zero would understate a cadet who is simply
    // waiting on a grader.
    const graded = days.filter((d) => d.awarded !== null);
    const earned = graded.reduce((s, d) => s + (d.awarded ?? 0), 0);
    const possible = graded.reduce((s, d) => s + d.max, 0);

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      rank: u.rosterEntry?.rank ?? null,
      flight: u.rosterEntry?.flight ?? null,
      grade: u.rosterEntry?.grade ?? null,
      answered: days.length,
      pending: days.length - graded.length,
      earned,
      possible,
      days
    };
  });

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Cadet Scores</h1>
      <p className="dash-page__subtitle">
        Question of the Day results. Select a cadet to see every day they have answered.
      </p>
      <CadetScoresClient cadets={cadets} />
    </div>
  );
}

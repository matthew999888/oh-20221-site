export const dynamic = "force-dynamic";

import { requirePagePermission } from "@/lib/permissions-server";
import { canEdit } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { todayUtc, toDateInput } from "@/lib/questions";
import AnswerToday from "./AnswerToday";
import QuestionQueue, { type QueuedQuestion } from "./QuestionQueue";
import GradeQueue, { type PendingAnswer } from "./GradeQueue";

export default async function QuestionOfTheDayPage() {
  const session = await requirePagePermission("question-of-the-day", "view");
  const isStaff = canEdit(session.user.roles, "question-of-the-day");

  const today = todayUtc();

  const [todayQuestion, myAnswer] = await Promise.all([
    prisma.dailyQuestion.findUnique({ where: { scheduledFor: today } }),
    prisma.dailyQuestionAnswer.findFirst({
      where: { userId: session.user.id, question: { scheduledFor: today } },
      include: { question: true }
    })
  ]);

  // Staff-only data. Fetched conditionally so a cadet's page never
  // carries other cadets' answers in its payload.
  const [queue, pending] = isStaff
    ? await Promise.all([
        prisma.dailyQuestion.findMany({
          where: { scheduledFor: { gte: today } },
          orderBy: { scheduledFor: "asc" },
          include: { _count: { select: { answers: true } } }
        }),
        prisma.dailyQuestionAnswer.findMany({
          where: { awardedPoints: null },
          orderBy: { submittedAt: "asc" },
          take: 100,
          include: {
            question: { select: { questionText: true, points: true, answerKey: true, scheduledFor: true } },
            user: { select: { name: true } }
          }
        })
      ])
    : [[], []];

  const queueDto: QueuedQuestion[] = queue.map((q) => ({
    id: q.id,
    scheduledFor: toDateInput(q.scheduledFor),
    questionText: q.questionText,
    type: q.type,
    choiceA: q.choiceA ?? "",
    choiceB: q.choiceB ?? "",
    choiceC: q.choiceC ?? "",
    choiceD: q.choiceD ?? "",
    correctChoice: q.correctChoice ?? "A",
    answerKey: q.answerKey ?? "",
    points: q.points,
    answerCount: q._count.answers,
    isToday: q.scheduledFor.getTime() === today.getTime()
  }));

  const pendingDto: PendingAnswer[] = pending.map((a) => ({
    id: a.id,
    cadetName: a.user.name,
    questionText: a.question.questionText,
    answerKey: a.question.answerKey,
    maxPoints: a.question.points,
    writtenAnswer: a.writtenAnswer ?? "",
    date: toDateInput(a.question.scheduledFor)
  }));

  return (
    <div className="dash-page">
      <h1 className="dash-page__title">Question of the Day</h1>
      <p className="dash-page__subtitle">
        One question each day. Staff queue them ahead of time and the right one appears on its
        date — there is nothing to switch over each morning.
      </p>

      <AnswerToday
        question={
          todayQuestion
            ? {
                id: todayQuestion.id,
                questionText: todayQuestion.questionText,
                type: todayQuestion.type,
                choiceA: todayQuestion.choiceA,
                choiceB: todayQuestion.choiceB,
                choiceC: todayQuestion.choiceC,
                choiceD: todayQuestion.choiceD,
                points: todayQuestion.points
              }
            : null
        }
        alreadyAnswered={
          myAnswer
            ? {
                selectedChoice: myAnswer.selectedChoice,
                writtenAnswer: myAnswer.writtenAnswer,
                awardedPoints: myAnswer.awardedPoints,
                maxPoints: myAnswer.question.points,
                graderNote: myAnswer.graderNote
              }
            : null
        }
      />

      {isStaff && (
        <>
          <h2 className="dash-page__title" style={{ fontSize: "1.3rem", marginTop: "2.5rem" }}>
            Grading queue
          </h2>
          <GradeQueue initial={pendingDto} />

          <h2 className="dash-page__title" style={{ fontSize: "1.3rem", marginTop: "2.5rem" }}>
            Scheduled questions
          </h2>
          <QuestionQueue initial={queueDto} />
        </>
      )}
    </div>
  );
}

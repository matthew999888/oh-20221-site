"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertPagePermission, requireApprovedSession } from "@/lib/permissions-server";
import { logActivity } from "@/lib/activity-log";
import {
  autoGrade,
  parseDateInput,
  todayUtc,
  validateQuestion,
  type QuestionDraft
} from "@/lib/questions";

/* Shared column mapping. Choices are stored as null for written-answer
   questions so a later type change cannot leave stale options behind
   that the test-taking UI would then render. */
function toColumns(q: QuestionDraft) {
  const mc = q.type === "multiple_choice";
  return {
    questionText: q.questionText.trim(),
    type: q.type,
    choiceA: mc ? q.choiceA.trim() : null,
    choiceB: mc ? q.choiceB.trim() : null,
    choiceC: mc ? q.choiceC.trim() : null,
    choiceD: mc ? q.choiceD.trim() : null,
    correctChoice: mc ? q.correctChoice : null,
    answerKey: mc ? null : q.answerKey.trim() || null,
    points: q.points
  };
}

// ---------------------------------------------------------------------
// Promotion test questions
// ---------------------------------------------------------------------

export async function saveTestQuestion(
  rank: number,
  id: string | null,
  draft: QuestionDraft,
  order: number
) {
  const session = await assertPagePermission("promotion-tests-admin", "edit");

  // Re-validated server side: the client check is a convenience, not a
  // guarantee, and a malformed question is only discovered by the cadet
  // sitting the test.
  const problem = validateQuestion(draft);
  if (problem) throw new Error(problem);

  const data = { ...toColumns(draft), rank, order };
  const row = id
    ? await prisma.promotionTestQuestion.update({ where: { id }, data })
    : await prisma.promotionTestQuestion.create({ data });

  await logActivity(
    session.user.id,
    id ? "promotion-question.updated" : "promotion-question.created",
    "PromotionTestQuestion",
    row.id,
    { rank }
  );
  revalidatePath("/dashboard/promotions/manage");
  revalidatePath(`/dashboard/promotions/${rank}`);
  return row;
}

export async function deleteTestQuestion(id: string) {
  const session = await assertPagePermission("promotion-tests-admin", "edit");
  const row = await prisma.promotionTestQuestion.delete({ where: { id } });
  await logActivity(session.user.id, "promotion-question.deleted", "PromotionTestQuestion", id);
  revalidatePath("/dashboard/promotions/manage");
  revalidatePath(`/dashboard/promotions/${row.rank}`);
}

export async function reorderTestQuestion(id: string, direction: "up" | "down") {
  await assertPagePermission("promotion-tests-admin", "edit");

  const q = await prisma.promotionTestQuestion.findUnique({ where: { id } });
  if (!q) throw new Error("Question not found.");

  // Swap with the adjacent question rather than rewriting every order
  // value, so two editors working at once cannot renumber each other.
  const neighbour = await prisma.promotionTestQuestion.findFirst({
    where:
      direction === "up"
        ? { rank: q.rank, order: { lt: q.order } }
        : { rank: q.rank, order: { gt: q.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" }
  });
  if (!neighbour) return;

  await prisma.$transaction([
    prisma.promotionTestQuestion.update({ where: { id: q.id }, data: { order: neighbour.order } }),
    prisma.promotionTestQuestion.update({ where: { id: neighbour.id }, data: { order: q.order } })
  ]);
  revalidatePath("/dashboard/promotions/manage");
}

// ---------------------------------------------------------------------
// Question of the Day
// ---------------------------------------------------------------------

export async function saveDailyQuestion(
  id: string | null,
  dateInput: string,
  draft: QuestionDraft
) {
  const session = await assertPagePermission("question-of-the-day", "edit");

  const problem = validateQuestion(draft);
  if (problem) throw new Error(problem);

  const scheduledFor = parseDateInput(dateInput);
  if (!scheduledFor) throw new Error("Pick a valid date.");

  const data = { ...toColumns(draft), scheduledFor, createdById: session.user.id };

  // scheduledFor is unique — one question per day. Upsert so re-saving
  // an existing date edits it instead of failing on the constraint.
  const row = id
    ? await prisma.dailyQuestion.update({ where: { id }, data })
    : await prisma.dailyQuestion.upsert({
        where: { scheduledFor },
        update: data,
        create: data
      });

  await logActivity(session.user.id, "daily-question.saved", "DailyQuestion", row.id, {
    scheduledFor: dateInput
  });
  revalidatePath("/dashboard/question-of-the-day");
  return row;
}

export async function deleteDailyQuestion(id: string) {
  const session = await assertPagePermission("question-of-the-day", "edit");
  await prisma.dailyQuestion.delete({ where: { id } });
  await logActivity(session.user.id, "daily-question.deleted", "DailyQuestion", id);
  revalidatePath("/dashboard/question-of-the-day");
}

/** A cadet answering today's question. */
export async function answerDailyQuestion(
  questionId: string,
  selectedChoice: string | null,
  writtenAnswer: string | null
) {
  const session = await requireApprovedSession();

  const question = await prisma.dailyQuestion.findUnique({ where: { id: questionId } });
  if (!question) throw new Error("That question no longer exists.");

  // Only today's question is answerable. Without this check a cadet
  // could submit against a future question id and bank an answer early.
  const today = todayUtc();
  if (question.scheduledFor.getTime() !== today.getTime()) {
    throw new Error("That question is not today's question.");
  }

  const existing = await prisma.dailyQuestionAnswer.findUnique({
    where: { questionId_userId: { questionId, userId: session.user.id } }
  });
  if (existing) throw new Error("You have already answered today's question.");

  const awardedPoints = autoGrade(
    question.type,
    question.correctChoice,
    selectedChoice,
    question.points
  );

  await prisma.dailyQuestionAnswer.create({
    data: {
      questionId,
      userId: session.user.id,
      selectedChoice,
      writtenAnswer: writtenAnswer?.trim() || null,
      awardedPoints,
      gradedAt: awardedPoints === null ? null : new Date()
    }
  });

  revalidatePath("/dashboard/question-of-the-day");
}

/** Staff grading a written answer. */
export async function gradeDailyAnswer(answerId: string, points: number, note: string) {
  const session = await assertPagePermission("question-of-the-day", "edit");

  const answer = await prisma.dailyQuestionAnswer.findUnique({
    where: { id: answerId },
    include: { question: { select: { points: true } } }
  });
  if (!answer) throw new Error("Answer not found.");

  const max = answer.question.points;
  if (!Number.isInteger(points) || points < 0 || points > max) {
    throw new Error(`Points must be a whole number between 0 and ${max}.`);
  }

  await prisma.dailyQuestionAnswer.update({
    where: { id: answerId },
    data: {
      awardedPoints: points,
      graderNote: note.trim() || null,
      gradedById: session.user.id,
      gradedAt: new Date()
    }
  });

  await logActivity(session.user.id, "daily-answer.graded", "DailyQuestionAnswer", answerId, {
    points
  });
  revalidatePath("/dashboard/question-of-the-day");
  revalidatePath("/dashboard/cadet-scores");
}

// ---------------------------------------------------------------------
// Command staff roster (public homepage)
// ---------------------------------------------------------------------

export type CommandStaffInput = { rank: string; name: string; role: string; order: number };

export async function saveCommandStaff(id: string | null, data: CommandStaffInput) {
  const session = await assertPagePermission("website-admin", "edit");
  const clean = {
    rank: data.rank.trim(),
    name: data.name.trim(),
    role: data.role.trim(),
    order: Number.isFinite(data.order) ? data.order : 0
  };
  if (!clean.name) throw new Error("Enter a name.");

  const row = id
    ? await prisma.commandStaff.update({ where: { id }, data: clean })
    : await prisma.commandStaff.create({ data: clean });

  await logActivity(session.user.id, "command-staff.saved", "CommandStaff", row.id);
  revalidatePath("/");
  revalidatePath("/admin/website");
  return row;
}

export async function deleteCommandStaff(id: string) {
  const session = await assertPagePermission("website-admin", "edit");
  await prisma.commandStaff.delete({ where: { id } });
  await logActivity(session.user.id, "command-staff.deleted", "CommandStaff", id);
  revalidatePath("/");
  revalidatePath("/admin/website");
}

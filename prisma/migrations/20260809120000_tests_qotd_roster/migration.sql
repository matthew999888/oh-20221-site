-- Adds question types (multiple choice / short / long answer) to the
-- promotion test, a per-question response table so written answers can
-- be graded by a human, the Question of the Day, and a staff-editable
-- command roster.
--
-- NOTE: "updatedAt" on PromotionTestQuestion is added WITH a default.
-- Prisma emits it as a bare NOT NULL, which fails on any database that
-- already has questions in it (a restored backup, for instance). The
-- table is empty today; the default makes it safe anywhere.

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('multiple_choice', 'short_answer', 'long_answer');

-- AlterTable
ALTER TABLE "PromotionTestQuestion" ADD COLUMN     "answerKey" TEXT,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'multiple_choice',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "choiceA" DROP NOT NULL,
ALTER COLUMN "choiceB" DROP NOT NULL,
ALTER COLUMN "choiceC" DROP NOT NULL,
ALTER COLUMN "choiceD" DROP NOT NULL,
ALTER COLUMN "correctChoice" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CommandStaff" (
    "id" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommandStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionTestResponse" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedChoice" TEXT,
    "writtenAnswer" TEXT,
    "awardedPoints" INTEGER,
    "graderNote" TEXT,
    "gradedById" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionTestResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestion" (
    "id" TEXT NOT NULL,
    "scheduledFor" DATE NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'multiple_choice',
    "choiceA" TEXT,
    "choiceB" TEXT,
    "choiceC" TEXT,
    "choiceD" TEXT,
    "correctChoice" TEXT,
    "answerKey" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestionAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedChoice" TEXT,
    "writtenAnswer" TEXT,
    "awardedPoints" INTEGER,
    "graderNote" TEXT,
    "gradedById" TEXT,
    "gradedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommandStaff_order_idx" ON "CommandStaff"("order");

-- CreateIndex
CREATE INDEX "PromotionTestResponse_questionId_idx" ON "PromotionTestResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionTestResponse_attemptId_questionId_key" ON "PromotionTestResponse"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestion_scheduledFor_key" ON "DailyQuestion"("scheduledFor");

-- CreateIndex
CREATE INDEX "DailyQuestion_scheduledFor_idx" ON "DailyQuestion"("scheduledFor");

-- CreateIndex
CREATE INDEX "DailyQuestionAnswer_userId_submittedAt_idx" ON "DailyQuestionAnswer"("userId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuestionAnswer_questionId_userId_key" ON "DailyQuestionAnswer"("questionId", "userId");

-- AddForeignKey
ALTER TABLE "PromotionTestResponse" ADD CONSTRAINT "PromotionTestResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "PromotionTestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionTestResponse" ADD CONSTRAINT "PromotionTestResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PromotionTestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuestionAnswer" ADD CONSTRAINT "DailyQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DailyQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuestionAnswer" ADD CONSTRAINT "DailyQuestionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


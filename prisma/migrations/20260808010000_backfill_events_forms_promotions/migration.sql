-- Backfill migration.
--
-- The original init migration predates seven models that were added to
-- schema.prisma in later commits (Events/hours tracker, the ops-order
-- status singleton, promotion tests, and the two staff forms). Those
-- were applied to the old database with `prisma db push`, which writes
-- no migration file — so migration history and schema.prisma had drifted
-- apart and a fresh `migrate deploy` produced an incomplete database.
--
-- This migration contains exactly the missing objects, generated from
-- `prisma migrate diff --from-empty --to-schema-datamodel` and filtered
-- to the seven tables plus the EventType enum they depend on. Verified
-- against the live database: no column drift on pre-existing tables.

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ldr', 'squadron_activity', 'community_service', 'other');

-- CreateTable
CREATE TABLE "OpsOrderStatus" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "uniformOfTheDay" TEXT,
    "ptDay" TEXT,
    "ptDetails" TEXT,
    "honorCode" TEXT,
    "honorCodeTitle" TEXT,
    "honorCodeLead" TEXT,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsOrderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'other',
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rosterEntryId" TEXT NOT NULL,
    "hoursOverride" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionTestQuestion" (
    "id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "choiceA" TEXT NOT NULL,
    "choiceB" TEXT NOT NULL,
    "choiceC" TEXT NOT NULL,
    "choiceD" TEXT NOT NULL,
    "correctChoice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionTestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromotionTestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffJournalEntry" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "didThisMonth" TEXT NOT NULL,
    "comingUp" TEXT NOT NULL,
    "barriers" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffEvaluation" (
    "id" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "cadetName" TEXT NOT NULL,
    "cadetRank" TEXT,
    "cadetFlight" TEXT,
    "evalDate" TIMESTAMP(3) NOT NULL,
    "readiness" TEXT,
    "ratings" JSONB NOT NULL,
    "comments" JSONB NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE INDEX "EventAttendance_rosterEntryId_idx" ON "EventAttendance"("rosterEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendance_eventId_rosterEntryId_key" ON "EventAttendance"("eventId", "rosterEntryId");

-- CreateIndex
CREATE INDEX "PromotionTestQuestion_rank_order_idx" ON "PromotionTestQuestion"("rank", "order");

-- CreateIndex
CREATE INDEX "PromotionTestAttempt_userId_rank_idx" ON "PromotionTestAttempt"("userId", "rank");

-- CreateIndex
CREATE INDEX "PromotionTestAttempt_submittedAt_idx" ON "PromotionTestAttempt"("submittedAt");

-- CreateIndex
CREATE INDEX "StaffJournalEntry_authorId_idx" ON "StaffJournalEntry"("authorId");

-- CreateIndex
CREATE INDEX "StaffJournalEntry_createdAt_idx" ON "StaffJournalEntry"("createdAt");

-- CreateIndex
CREATE INDEX "StaffEvaluation_evaluatorId_idx" ON "StaffEvaluation"("evaluatorId");

-- CreateIndex
CREATE INDEX "StaffEvaluation_createdAt_idx" ON "StaffEvaluation"("createdAt");

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendance" ADD CONSTRAINT "EventAttendance_rosterEntryId_fkey" FOREIGN KEY ("rosterEntryId") REFERENCES "RosterEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionTestAttempt" ADD CONSTRAINT "PromotionTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffJournalEntry" ADD CONSTRAINT "StaffJournalEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEvaluation" ADD CONSTRAINT "StaffEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

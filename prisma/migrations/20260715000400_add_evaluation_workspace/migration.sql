CREATE TYPE "EvaluationStatus" AS ENUM ('DRAFT', 'FINALIZED');
CREATE TYPE "CommentStatus" AS ENUM ('OPEN', 'RESOLVED', 'ORPHANED');
CREATE TYPE "CommentAuthorType" AS ENUM ('AI', 'TEACHER');

CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalSuggestedMarks" INTEGER NOT NULL DEFAULT 0,
    "totalFinalMarks" INTEGER NOT NULL DEFAULT 0,
    "overallFeedback" TEXT,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation_questions" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "rubricQuestionId" TEXT NOT NULL,
    "earnedMarksSuggested" INTEGER NOT NULL,
    "earnedMarksFinal" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "answerContentJson" JSONB NOT NULL,
    CONSTRAINT "evaluation_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comment_threads" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "questionId" TEXT,
    "anchorJson" JSONB NOT NULL,
    "status" "CommentStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "comment_threads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluation_versions" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evaluation_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "evaluations_submissionId_key" ON "evaluations"("submissionId");
CREATE UNIQUE INDEX "evaluation_questions_evaluationId_rubricQuestionId_key" ON "evaluation_questions"("evaluationId", "rubricQuestionId");
CREATE UNIQUE INDEX "evaluation_versions_evaluationId_version_key" ON "evaluation_versions"("evaluationId", "version");

ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_rubricQuestionId_fkey" FOREIGN KEY ("rubricQuestionId") REFERENCES "rubric_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "comment_threads" ADD CONSTRAINT "comment_threads_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_threads" ADD CONSTRAINT "comment_threads_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "evaluation_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "comment_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluation_versions" ADD CONSTRAINT "evaluation_versions_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

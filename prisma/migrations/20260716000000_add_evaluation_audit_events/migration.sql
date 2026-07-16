CREATE TYPE "EvaluationVersionEvent" AS ENUM ('FINALIZED', 'REOPENED');

ALTER TABLE "evaluation_versions"
  ADD COLUMN "event" "EvaluationVersionEvent" NOT NULL DEFAULT 'FINALIZED',
  ADD COLUMN "actorName" TEXT NOT NULL DEFAULT 'Unknown';

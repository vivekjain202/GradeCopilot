CREATE TYPE "ProcessingJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "processing_jobs" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processing_jobs_submissionId_key" ON "processing_jobs"("submissionId");
CREATE INDEX "processing_jobs_status_createdAt_idx" ON "processing_jobs"("status", "createdAt");
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "ReportStatus" ADD VALUE 'PUBLISHED';
ALTER TABLE "report_cards" ADD COLUMN "publishTokenHash" TEXT, ADD COLUMN "publishedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "report_cards_publishTokenHash_key" ON "report_cards"("publishTokenHash");

CREATE TYPE "ReportStatus" AS ENUM ('DRAFT');

CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "improvementAreas" JSONB NOT NULL,
    "nextSteps" JSONB NOT NULL,
    "teacherNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_versions" (
    "id" TEXT NOT NULL,
    "reportCardId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "report_cards_evaluationId_key" ON "report_cards"("evaluationId");
CREATE UNIQUE INDEX "report_versions_reportCardId_version_key" ON "report_versions"("reportCardId", "version");
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report_versions" ADD CONSTRAINT "report_versions_reportCardId_fkey" FOREIGN KEY ("reportCardId") REFERENCES "report_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

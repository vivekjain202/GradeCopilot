-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('UPLOADED', 'QUEUED', 'EXTRACTING', 'EVALUATING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "submissions_fileKey_key" ON "submissions"("fileKey");
CREATE INDEX "submissions_teacherId_createdAt_idx" ON "submissions"("teacherId", "createdAt");
CREATE INDEX "submissions_testId_studentId_idx" ON "submissions"("testId", "studentId");
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

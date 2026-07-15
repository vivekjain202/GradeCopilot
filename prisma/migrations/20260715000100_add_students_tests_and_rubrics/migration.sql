-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "rollNumber" TEXT,
    "guardianEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "testDate" TIMESTAMP(3) NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rubric_questions" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "expectedAnswer" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "maxMarks" INTEGER NOT NULL,

    CONSTRAINT "rubric_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "students_teacherId_name_idx" ON "students"("teacherId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_teacherId_rollNumber_key" ON "students"("teacherId", "rollNumber");

-- CreateIndex
CREATE INDEX "tests_teacherId_testDate_idx" ON "tests"("teacherId", "testDate");

-- CreateIndex
CREATE UNIQUE INDEX "rubric_questions_testId_position_key" ON "rubric_questions"("testId", "position");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rubric_questions" ADD CONSTRAINT "rubric_questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

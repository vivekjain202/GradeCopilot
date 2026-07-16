ALTER TABLE "rubric_questions" ADD COLUMN "questionNumber" TEXT;

UPDATE "rubric_questions" SET "questionNumber" = "label" WHERE "questionNumber" IS NULL;

ALTER TABLE "rubric_questions" ALTER COLUMN "questionNumber" SET NOT NULL;
CREATE UNIQUE INDEX "rubric_questions_testId_questionNumber_key" ON "rubric_questions"("testId", "questionNumber");

import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { ProcessingJobStatus, ProcessingStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { openAiEvaluationProvider, openAiOcrProvider } from "@/lib/evaluations/openai";
import { createSubmissionDownloadUrl } from "@/lib/storage";

const MAX_ATTEMPTS = 3;

type ProcessingOutcome = "processed" | "empty" | "failed";

export async function processQueuedJobs(limit = 1) {
  const outcomes: ProcessingOutcome[] = [];
  for (let index = 0; index < limit; index += 1) {
    const outcome = await processOneQueuedJob();
    outcomes.push(outcome);
    if (outcome === "empty") break;
  }
  return outcomes;
}

async function processOneQueuedJob(): Promise<ProcessingOutcome> {
  const candidate = await db.processingJob.findFirst({
    where: { status: ProcessingJobStatus.QUEUED },
    orderBy: { createdAt: "asc" },
    select: { id: true, submissionId: true },
  });
  if (!candidate) return "empty";

  const claimed = await db.processingJob.updateMany({
    where: { id: candidate.id, status: ProcessingJobStatus.QUEUED },
    data: {
      status: ProcessingJobStatus.RUNNING,
      attempts: { increment: 1 },
      errorCode: null,
    },
  });
  if (claimed.count !== 1) return "empty";

  try {
    await processSubmission(candidate.id, candidate.submissionId);
    return "processed";
  } catch (error) {
    await markProcessingFailed(candidate.id, candidate.submissionId, error);
    return "failed";
  }
}

async function processSubmission(jobId: string, submissionId: string) {
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      evaluation: { select: { id: true } },
      test: { include: { rubricQuestions: { orderBy: { position: "asc" } } } },
    },
  });
  if (!submission) throw new Error("SUBMISSION_NOT_FOUND");

  // A retry must never replace a draft that a teacher may have already changed.
  if (submission.evaluation) {
    await db.$transaction([
      db.submission.update({
        where: { id: submission.id },
        data: { processingStatus: ProcessingStatus.READY, processingError: null },
      }),
      db.processingJob.update({
        where: { id: jobId },
        data: { status: ProcessingJobStatus.SUCCEEDED, errorCode: null },
      }),
    ]);
    return;
  }

  await db.submission.update({
    where: { id: submission.id },
    data: { processingStatus: ProcessingStatus.EXTRACTING, processingError: null },
  });
  const signedUrl = await createSubmissionDownloadUrl(submission.fileKey);
  const transcription = await openAiOcrProvider.extract({
    signedUrl,
    mimeType: submission.mimeType,
  });

  await db.submission.update({
    where: { id: submission.id },
    data: { processingStatus: ProcessingStatus.EVALUATING },
  });
  const draft = await openAiEvaluationProvider.evaluate({
    transcription,
    rubric: submission.test.rubricQuestions.map((question) => ({
      id: question.id,
      questionNumber: question.questionNumber || question.label,
      prompt: question.prompt,
      criteria: question.criteria,
      maxMarks: question.maxMarks,
    })),
  });

  const questionsByRubricId = new Map(
    submission.test.rubricQuestions.map((question) => [question.id, question]),
  );
  if (
    draft.questions.length !== questionsByRubricId.size ||
    new Set(draft.questions.map((question) => question.rubricQuestionId)).size !==
      questionsByRubricId.size ||
    draft.questions.some((question) => {
      const rubric = questionsByRubricId.get(question.rubricQuestionId);
      return !rubric || question.suggestedMarks > rubric.maxMarks;
    })
  ) {
    throw new Error("INVALID_EVALUATION_RESULT");
  }

  const totalSuggestedMarks = draft.questions.reduce(
    (total, question) => total + question.suggestedMarks,
    0,
  );
  await db.$transaction(async (transaction) => {
    const evaluation = await transaction.evaluation.create({
      data: {
        submissionId: submission.id,
        totalSuggestedMarks,
        // These are AI-proposed marks in a DRAFT. Teachers can change them before finalizing.
        totalFinalMarks: totalSuggestedMarks,
        overallFeedback:
          "AI-generated draft — teacher review required before finalizing.",
        questions: {
          create: draft.questions.map((question) => ({
            rubricQuestionId: question.rubricQuestionId,
            earnedMarksSuggested: question.suggestedMarks,
            earnedMarksFinal: question.suggestedMarks,
            rationale: question.rationale,
            answerContentJson: answerToDocument(question.answerText),
          })),
        },
      },
      include: { questions: true },
    });
    const questionIds = new Map(
      evaluation.questions.map((question) => [question.rubricQuestionId, question.id]),
    );
    await Promise.all(
      draft.questions.flatMap((question) =>
        question.comments.slice(0, 3).map((body) => {
          const questionId = questionIds.get(question.rubricQuestionId);
          if (!questionId) throw new Error("EVALUATION_QUESTION_NOT_FOUND");
          return transaction.commentThread.create({
            data: {
              evaluationId: evaluation.id,
              questionId,
              anchorJson: { type: "question", questionId },
              comments: { create: { authorType: "AI", body } },
            },
          });
        }),
      ),
    );
    await transaction.submission.update({
      where: { id: submission.id },
      data: { processingStatus: ProcessingStatus.READY, processingError: null },
    });
    await transaction.processingJob.update({
      where: { id: jobId },
      data: { status: ProcessingJobStatus.SUCCEEDED, errorCode: null },
    });
  });
}

function answerToDocument(answerText: string): Prisma.InputJsonValue {
  return {
    type: "doc",
    content: answerText.trim()
      ? [{ type: "paragraph", content: [{ type: "text", text: answerText.trim() }] }]
      : [],
  };
}

async function markProcessingFailed(
  jobId: string,
  submissionId: string,
  error: unknown,
) {
  const job = await db.processingJob.findUnique({
    where: { id: jobId },
    select: { attempts: true },
  });
  const errorCode =
    error instanceof Error && error.message === "SUBMISSION_NOT_FOUND"
      ? "SUBMISSION_NOT_FOUND"
      : "AI_PROCESSING_FAILED";
  const retryable = (job?.attempts ?? MAX_ATTEMPTS) < MAX_ATTEMPTS;
  await db.$transaction([
    db.submission.updateMany({
      where: { id: submissionId },
      data: {
        processingStatus: ProcessingStatus.FAILED,
        processingError: retryable
          ? "Processing did not complete. You can retry this submission."
          : "Processing could not be completed after several attempts. Please retry when ready.",
      },
    }),
    db.processingJob.update({
      where: { id: jobId },
      data: { status: ProcessingJobStatus.FAILED, errorCode },
    }),
  ]);
}

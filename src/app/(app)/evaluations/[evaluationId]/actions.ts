"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

async function ownedDraftEvaluation(teacherId: string, evaluationId: string) {
  return db.evaluation.findFirst({
    where: { id: evaluationId, status: "DRAFT", submission: { teacherId } },
    select: { id: true },
  });
}

const documentContentSchema = z.object({
  type: z.literal("doc"),
  content: z.array(z.unknown()),
});

const threadInputSchema = z.object({
  evaluationId: z.string().cuid(),
  questionId: z.string().cuid(),
  body: z.string().trim().min(1).max(2000),
  anchor: z.object({
    from: z.number().int().nonnegative(),
    to: z.number().int().nonnegative(),
    quote: z.string().max(1000),
  }),
});

export async function updateEvaluationMarks(
  evaluationId: string,
  questionId: string,
  earnedMarksFinal: number,
) {
  const teacher = await requireAuthenticatedTeacher();
  if (!Number.isInteger(earnedMarksFinal) || earnedMarksFinal < 0)
    throw new Error("Invalid mark.");
  if (!(await ownedDraftEvaluation(teacher.id, evaluationId)))
    throw new Error("Finalized evaluations must be reopened before editing.");
  const question = await db.evaluationQuestion.findFirst({
    where: { id: questionId, evaluationId },
    include: { rubricQuestion: true },
  });
  if (!question || earnedMarksFinal > question.rubricQuestion.maxMarks)
    throw new Error("Mark exceeds rubric maximum.");
  await db.evaluationQuestion.update({
    where: { id: question.id },
    data: { earnedMarksFinal },
  });
  const total = await db.evaluationQuestion.aggregate({
    where: { evaluationId },
    _sum: { earnedMarksFinal: true },
  });
  await db.evaluation.update({
    where: { id: evaluationId },
    data: { totalFinalMarks: total._sum.earnedMarksFinal ?? 0 },
  });
  revalidatePath(`/evaluations/${evaluationId}`);
}

export async function resolveCommentThread(evaluationId: string, threadId: string) {
  const teacher = await requireAuthenticatedTeacher();
  if (!(await ownedDraftEvaluation(teacher.id, evaluationId)))
    throw new Error("Finalized evaluations must be reopened before editing.");
  await db.commentThread.updateMany({
    where: { id: threadId, evaluationId },
    data: { status: "RESOLVED" },
  });
  revalidatePath(`/evaluations/${evaluationId}`);
}

export async function updateEvaluationAnswer(
  evaluationId: string,
  questionId: string,
  answerContentJson: unknown,
) {
  const teacher = await requireAuthenticatedTeacher();
  const document = documentContentSchema.safeParse(answerContentJson);

  if (!document.success || !(await ownedDraftEvaluation(teacher.id, evaluationId))) {
    throw new Error("Finalized evaluations must be reopened before editing.");
  }

  const question = await db.evaluationQuestion.findFirst({
    where: { id: questionId, evaluationId },
    select: { id: true },
  });

  if (!question) {
    throw new Error("Evaluation answer not found.");
  }

  const serializedContent = JSON.stringify(document.data);
  await db.evaluationQuestion.update({
    where: { id: question.id },
    data: { answerContentJson: document.data as Prisma.InputJsonValue },
  });

  // An anchor is orphaned when its selected quote disappears from the edited document.
  const threads = await db.commentThread.findMany({
    where: { evaluationId, questionId, status: { in: ["OPEN", "ORPHANED"] } },
    select: { id: true, anchorJson: true, status: true },
  });
  await Promise.all(
    threads.map((thread) => {
      const quote = readAnchorQuote(thread.anchorJson);
      const status = quote
        ? serializedContent.includes(quote)
          ? "OPEN"
          : "ORPHANED"
        : thread.status;
      return status !== thread.status
        ? db.commentThread.update({ where: { id: thread.id }, data: { status } })
        : Promise.resolve();
    }),
  );

  revalidatePath(`/evaluations/${evaluationId}`);
}

export async function createCommentThread(input: unknown) {
  const teacher = await requireAuthenticatedTeacher();
  const parsed = threadInputSchema.safeParse(input);

  if (
    !parsed.success ||
    !(await ownedDraftEvaluation(teacher.id, parsed.data.evaluationId))
  ) {
    throw new Error("Could not create this comment.");
  }

  const question = await db.evaluationQuestion.findFirst({
    where: { id: parsed.data.questionId, evaluationId: parsed.data.evaluationId },
    select: { id: true },
  });

  if (!question) {
    throw new Error("Could not create this comment.");
  }

  await db.commentThread.create({
    data: {
      evaluationId: parsed.data.evaluationId,
      questionId: question.id,
      anchorJson: parsed.data.anchor,
      comments: { create: { authorType: "TEACHER", body: parsed.data.body } },
    },
  });
  revalidatePath(`/evaluations/${parsed.data.evaluationId}`);
}

export async function deleteCommentThread(evaluationId: string, threadId: string) {
  const teacher = await requireAuthenticatedTeacher();
  if (!(await ownedDraftEvaluation(teacher.id, evaluationId))) {
    throw new Error("Finalized evaluations must be reopened before editing.");
  }

  await db.commentThread.deleteMany({ where: { id: threadId, evaluationId } });
  revalidatePath(`/evaluations/${evaluationId}`);
}

function readAnchorQuote(anchorJson: unknown) {
  if (
    typeof anchorJson === "object" &&
    anchorJson !== null &&
    "quote" in anchorJson &&
    typeof anchorJson.quote === "string"
  ) {
    return anchorJson.quote;
  }

  return null;
}

export async function finalizeEvaluation(evaluationId: string) {
  const teacher = await requireAuthenticatedTeacher();
  const evaluation = await db.evaluation.findFirst({
    where: { id: evaluationId, status: "DRAFT", submission: { teacherId: teacher.id } },
    include: {
      questions: { include: { rubricQuestion: true } },
      commentThreads: { include: { comments: true } },
    },
  });

  if (!evaluation) {
    throw new Error("Only draft evaluations can be finalized.");
  }

  await db.$transaction(async (transaction) => {
    const latest = await transaction.evaluationVersion.aggregate({
      where: { evaluationId },
      _max: { version: true },
    });
    const version = (latest._max.version ?? 0) + 1;
    const snapshot = createEvaluationSnapshot(evaluation, "FINALIZED");

    await transaction.evaluationVersion.create({
      data: {
        evaluationId,
        version,
        event: "FINALIZED",
        actorName: teacher.name,
        snapshot: snapshot as Prisma.InputJsonValue,
      },
    });
    await transaction.evaluation.update({
      where: { id: evaluationId },
      data: { status: "FINALIZED", finalizedAt: new Date() },
    });
  });
  revalidatePath(`/evaluations/${evaluationId}`);
}

export async function reopenEvaluation(evaluationId: string) {
  const teacher = await requireAuthenticatedTeacher();
  const evaluation = await db.evaluation.findFirst({
    where: {
      id: evaluationId,
      status: "FINALIZED",
      submission: { teacherId: teacher.id },
    },
    include: {
      questions: { include: { rubricQuestion: true } },
      commentThreads: { include: { comments: true } },
    },
  });

  if (!evaluation) {
    throw new Error("Only finalized evaluations can be reopened.");
  }

  await db.$transaction(async (transaction) => {
    const latest = await transaction.evaluationVersion.aggregate({
      where: { evaluationId },
      _max: { version: true },
    });
    await transaction.evaluationVersion.create({
      data: {
        evaluationId,
        version: (latest._max.version ?? 0) + 1,
        event: "REOPENED",
        actorName: teacher.name,
        snapshot: createEvaluationSnapshot(
          evaluation,
          "REOPENED",
        ) as Prisma.InputJsonValue,
      },
    });
    await transaction.evaluation.update({
      where: { id: evaluationId },
      data: { status: "DRAFT", finalizedAt: null },
    });
  });
  revalidatePath(`/evaluations/${evaluationId}`);
}

function createEvaluationSnapshot(
  evaluation: {
    totalFinalMarks: number;
    totalSuggestedMarks: number;
    overallFeedback: string | null;
    questions: Array<{
      rubricQuestion: { label: string; maxMarks: number };
      earnedMarksFinal: number;
      earnedMarksSuggested: number;
      rationale: string;
      answerContentJson: unknown;
    }>;
    commentThreads: Array<{
      status: string;
      anchorJson: unknown;
      comments: Array<{ body: string; authorType: string }>;
    }>;
  },
  event: "FINALIZED" | "REOPENED",
) {
  return {
    event,
    totalFinalMarks: evaluation.totalFinalMarks,
    totalSuggestedMarks: evaluation.totalSuggestedMarks,
    overallFeedback: evaluation.overallFeedback,
    questions: evaluation.questions.map((question) => ({
      label: question.rubricQuestion.label,
      maxMarks: question.rubricQuestion.maxMarks,
      earnedMarksFinal: question.earnedMarksFinal,
      earnedMarksSuggested: question.earnedMarksSuggested,
      rationale: question.rationale,
      answerContentJson: question.answerContentJson,
    })),
    comments: evaluation.commentThreads.map((thread) => ({
      status: thread.status,
      anchorJson: thread.anchorJson,
      comments: thread.comments,
    })),
  };
}

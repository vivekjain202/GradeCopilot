"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

async function ownedEvaluation(teacherId: string, evaluationId: string) {
  return db.evaluation.findFirst({
    where: { id: evaluationId, submission: { teacherId } },
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
  if (!(await ownedEvaluation(teacher.id, evaluationId)))
    throw new Error("Evaluation not found.");
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
  if (!(await ownedEvaluation(teacher.id, evaluationId)))
    throw new Error("Evaluation not found.");
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

  if (!document.success || !(await ownedEvaluation(teacher.id, evaluationId))) {
    throw new Error("Evaluation answer not found.");
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
    !(await ownedEvaluation(teacher.id, parsed.data.evaluationId))
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
  if (!(await ownedEvaluation(teacher.id, evaluationId))) {
    throw new Error("Evaluation not found.");
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

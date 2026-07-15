"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";

async function ownedEvaluation(teacherId: string, evaluationId: string) {
  return db.evaluation.findFirst({
    where: { id: evaluationId, submission: { teacherId } },
    select: { id: true },
  });
}

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

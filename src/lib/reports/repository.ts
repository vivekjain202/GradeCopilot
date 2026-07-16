import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export async function createReportFromFinalizedEvaluation(
  teacherId: string,
  evaluationId: string,
) {
  const evaluation = await db.evaluation.findFirst({
    where: { id: evaluationId, status: "FINALIZED", submission: { teacherId } },
    include: {
      submission: { include: { student: true, test: true } },
      questions: { include: { rubricQuestion: true } },
    },
  });

  if (!evaluation) return null;

  const existing = await db.reportCard.findUnique({
    where: { evaluationId },
    select: { id: true },
  });
  if (existing) return existing;

  const strengths = evaluation.questions
    .filter(
      (question) => question.earnedMarksFinal === question.rubricQuestion.maxMarks,
    )
    .map((question) => `Strong performance in ${question.rubricQuestion.label}.`);
  const improvementAreas = evaluation.questions
    .filter((question) => question.earnedMarksFinal < question.rubricQuestion.maxMarks)
    .map((question) => `Continue practising ${question.rubricQuestion.label}.`);
  const safeStrengths = strengths.length
    ? strengths
    : ["Completed the assessment with care."];
  const safeImprovements = improvementAreas.length
    ? improvementAreas
    : ["Keep extending this strong performance with regular practice."];
  const nextSteps = safeImprovements.map(
    (area) => `${area} Review one example each week.`,
  );
  const summary = `${evaluation.submission.student.name} scored ${evaluation.totalFinalMarks} out of ${evaluation.submission.test.totalMarks} in ${evaluation.submission.test.title}.`;

  return db.$transaction(async (transaction) => {
    const report = await transaction.reportCard.create({
      data: {
        evaluationId,
        summary,
        strengths: safeStrengths,
        improvementAreas: safeImprovements,
        nextSteps,
      },
    });
    await transaction.reportVersion.create({
      data: {
        reportCardId: report.id,
        version: 1,
        snapshot: reportSnapshot(report) as Prisma.InputJsonValue,
      },
    });
    return { id: report.id };
  });
}

export function findReportByTeacher(teacherId: string, reportId: string) {
  return db.reportCard.findFirst({
    where: { id: reportId, evaluation: { submission: { teacherId } } },
    include: {
      evaluation: {
        include: { submission: { include: { student: true, test: true } } },
      },
      versions: { orderBy: { version: "desc" } },
    },
  });
}

export function reportSnapshot(report: {
  summary: string;
  strengths: unknown;
  improvementAreas: unknown;
  nextSteps: unknown;
  teacherNote: string | null;
}) {
  return {
    summary: report.summary,
    strengths: report.strengths,
    improvementAreas: report.improvementAreas,
    nextSteps: report.nextSteps,
    teacherNote: report.teacherNote,
  };
}

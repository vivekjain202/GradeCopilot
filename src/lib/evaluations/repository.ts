import "server-only";

import { db } from "@/lib/db";
import { createDeterministicDraft } from "./mock-evaluator";

export async function createEvaluationDraft(teacherId: string, submissionId: string) {
  const submission = await db.submission.findFirst({
    where: { id: submissionId, teacherId },
    include: {
      test: {
        include: { rubricQuestions: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!submission) {
    return null;
  }

  const existing = await db.evaluation.findUnique({
    where: { submissionId },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  const draftQuestions = createDeterministicDraft(submission.test.rubricQuestions);
  const totalSuggestedMarks = draftQuestions.reduce(
    (total, question) => total + question.earnedMarksSuggested,
    0,
  );

  return db.$transaction(async (transaction) => {
    const evaluation = await transaction.evaluation.create({
      data: {
        submissionId: submission.id,
        totalSuggestedMarks,
        totalFinalMarks: totalSuggestedMarks,
        questions: {
          create: draftQuestions.map((question) => ({
            rubricQuestionId: question.rubricQuestionId,
            earnedMarksSuggested: question.earnedMarksSuggested,
            earnedMarksFinal: question.earnedMarksFinal,
            rationale: question.rationale,
            answerContentJson: question.answerContentJson,
          })),
        },
      },
      include: { questions: { include: { rubricQuestion: true } } },
    });

    await Promise.all(
      evaluation.questions.map((question, index) =>
        transaction.commentThread.create({
          data: {
            evaluationId: evaluation.id,
            questionId: question.id,
            anchorJson: { type: "question", questionId: question.id },
            comments: {
              create: {
                authorType: "AI",
                body: draftQuestions[index]?.comment ?? "Review this answer.",
              },
            },
          },
        }),
      ),
    );

    return { id: evaluation.id };
  });
}

import { notFound, redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";
import { EvaluationWorkspace } from "./_components/evaluation-workspace";
export const dynamic = "force-dynamic";
export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ evaluationId: string }>;
}) {
  const { evaluationId } = await params;
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) redirect("/login");
  const evaluation = await db.evaluation.findFirst({
    where: { id: evaluationId, submission: { teacherId: teacher.id } },
    include: {
      questions: { include: { rubricQuestion: true } },
      commentThreads: {
        include: { comments: true, question: { include: { rubricQuestion: true } } },
      },
      versions: { orderBy: { version: "desc" } },
    },
  });
  if (!evaluation) notFound();
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <EvaluationWorkspace
        evaluationId={evaluation.id}
        history={evaluation.versions.map((version) => ({
          id: version.id,
          version: version.version,
          event: version.event,
          actorName: version.actorName,
          createdAt: version.createdAt.toISOString(),
        }))}
        initialQuestions={evaluation.questions.map((question) => ({
          id: question.id,
          label: question.rubricQuestion.label,
          maxMarks: question.rubricQuestion.maxMarks,
          marks: question.earnedMarksFinal,
          rationale: question.rationale,
          answerContent: question.answerContentJson,
        }))}
        status={evaluation.status}
        initialThreads={evaluation.commentThreads.map((thread) => ({
          id: thread.id,
          questionId: thread.questionId,
          label: thread.question?.rubricQuestion.label ?? "General feedback",
          body: thread.comments[0]?.body ?? "No comment yet.",
          status: thread.status,
          anchor: thread.anchorJson,
        }))}
      />
    </main>
  );
}

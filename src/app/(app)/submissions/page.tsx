import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { isSubmissionRetryable } from "@/lib/submissions/processing";
import { listSubmissions } from "@/lib/submissions/repository";
import { retrySubmissionAction } from "./actions";

export const dynamic = "force-dynamic";

const statusCopy = {
  UPLOADED: "Uploaded — waiting to be queued",
  QUEUED: "Queued for evaluation",
  EXTRACTING: "Reading the test copy",
  EVALUATING: "Preparing draft evaluation",
  READY: "Draft evaluation ready",
  FAILED: "Processing needs attention",
} as const;

export default async function SubmissionsPage() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    redirect("/login");
  }

  const submissions = await listSubmissions(teacher.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Submissions</p>
          <h1 className="text-3xl font-bold">Test copies</h1>
        </div>
        <Link
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white"
          href="/submissions/new"
        >
          Upload test copy
        </Link>
      </div>
      {submissions.length ? (
        <ul className="mt-8 space-y-3">
          {submissions.map((submission) => {
            const retryAction = retrySubmissionAction.bind(null, submission.id);

            return (
              <li className="rounded-xl border bg-white p-5" key={submission.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {submission.student.name} · {submission.test.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {submission.fileName} · {statusCopy[submission.processingStatus]}
                    </p>
                    {submission.processingError ? (
                      <p className="mt-2 text-sm text-rose-700">
                        {submission.processingError}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      className="text-sm font-medium text-indigo-700 hover:text-indigo-500"
                      href={`/api/submissions/${submission.id}/download`}
                    >
                      View copy
                    </a>
                    {isSubmissionRetryable(submission.processingStatus) ? (
                      <form action={retryAction}>
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
                          type="submit"
                        >
                          Retry processing
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed p-8 text-slate-600">
          No test copies yet. Upload a student’s completed test to start a draft
          evaluation.
        </div>
      )}
    </main>
  );
}

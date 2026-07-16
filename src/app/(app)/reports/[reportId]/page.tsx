import { notFound, redirect } from "next/navigation";

import { getAuthenticatedTeacher } from "@/lib/authorization";
import { findReportByTeacher } from "@/lib/reports/repository";
import { ReportEditor } from "./_components/report-editor";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) redirect("/login");
  const report = await findReportByTeacher(teacher.id, reportId);
  if (!report) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-semibold text-indigo-700">Personalized report card</p>
      <h1 className="mt-2 text-3xl font-bold">
        {report.evaluation.submission.student.name}
      </h1>
      <p className="mt-1 text-slate-600">{report.evaluation.submission.test.title}</p>
      <div className="mt-8 rounded-xl border bg-white p-6">
        <ReportEditor
          initialReport={{
            summary: report.summary,
            strengths: asStringArray(report.strengths),
            improvementAreas: asStringArray(report.improvementAreas),
            nextSteps: asStringArray(report.nextSteps),
            teacherNote: report.teacherNote ?? "",
          }}
          reportId={report.id}
        />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {report.versions.length} saved version(s).
      </p>
    </main>
  );
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

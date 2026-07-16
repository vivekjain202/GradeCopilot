import { notFound } from "next/navigation";

import { findPublishedReportByTokenHash } from "@/lib/reports/repository";
import { hashShareToken } from "@/lib/reports/sharing";

export const dynamic = "force-dynamic";

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await findPublishedReportByTokenHash(hashShareToken(token));
  if (!report) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 text-slate-950">
      <p className="text-sm font-semibold text-indigo-700">Student report card</p>
      <h1 className="mt-2 text-3xl font-bold">
        {report.evaluation.submission.student.name}
      </h1>
      <p className="mt-1 text-slate-600">{report.evaluation.submission.test.title}</p>
      <section className="mt-8 space-y-6 rounded-xl border bg-white p-6">
        <ReportSection title="Summary" values={[report.summary]} />
        <ReportSection title="Strengths" values={asStringArray(report.strengths)} />
        <ReportSection
          title="Areas for improvement"
          values={asStringArray(report.improvementAreas)}
        />
        <ReportSection title="Next steps" values={asStringArray(report.nextSteps)} />
        {report.teacherNote ? (
          <ReportSection title="Teacher note" values={[report.teacherNote]} />
        ) : null}
      </section>
    </main>
  );
}

function ReportSection({ title, values }: { title: string; values: string[] }) {
  return (
    <section>
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

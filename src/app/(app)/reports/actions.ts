"use server";

import { redirect } from "next/navigation";

import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { createReportFromFinalizedEvaluation } from "@/lib/reports/repository";

export async function createReportCardAction(evaluationId: string) {
  const teacher = await requireAuthenticatedTeacher();
  const report = await createReportFromFinalizedEvaluation(teacher.id, evaluationId);
  if (!report) throw new Error("Finalize this evaluation before creating a report.");
  redirect(`/reports/${report.id}`);
}

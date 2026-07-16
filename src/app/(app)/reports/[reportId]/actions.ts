"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";
import { reportSnapshot } from "@/lib/reports/repository";
import { createShareToken, hashShareToken } from "@/lib/reports/sharing";

const reportInputSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  strengths: z.array(z.string().trim().min(1).max(1000)).min(1).max(10),
  improvementAreas: z.array(z.string().trim().min(1).max(1000)).min(1).max(10),
  nextSteps: z.array(z.string().trim().min(1).max(1000)).min(1).max(10),
  teacherNote: z.string().trim().max(4000),
});

export async function saveReportCard(reportId: string, input: unknown) {
  const teacher = await requireAuthenticatedTeacher();
  const parsed = reportInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Complete all required report fields.");

  const report = await db.reportCard.findFirst({
    where: { id: reportId, evaluation: { submission: { teacherId: teacher.id } } },
  });
  if (!report) throw new Error("Report not found.");

  await db.$transaction(async (transaction) => {
    const updated = await transaction.reportCard.update({
      where: { id: report.id },
      data: {
        summary: parsed.data.summary,
        strengths: parsed.data.strengths as Prisma.InputJsonValue,
        improvementAreas: parsed.data.improvementAreas as Prisma.InputJsonValue,
        nextSteps: parsed.data.nextSteps as Prisma.InputJsonValue,
        teacherNote: parsed.data.teacherNote || null,
      },
    });
    const latest = await transaction.reportVersion.aggregate({
      where: { reportCardId: report.id },
      _max: { version: true },
    });
    await transaction.reportVersion.create({
      data: {
        reportCardId: report.id,
        version: (latest._max.version ?? 0) + 1,
        snapshot: reportSnapshot(updated) as Prisma.InputJsonValue,
      },
    });
  });
  revalidatePath(`/reports/${reportId}`);
}

export async function publishReportCard(reportId: string) {
  const teacher = await requireAuthenticatedTeacher();
  const report = await db.reportCard.findFirst({
    where: { id: reportId, evaluation: { submission: { teacherId: teacher.id } } },
    select: { id: true },
  });
  if (!report) throw new Error("Report not found.");

  const token = createShareToken();
  await db.reportCard.update({
    where: { id: report.id },
    data: {
      status: "PUBLISHED",
      publishTokenHash: hashShareToken(token),
      publishedAt: new Date(),
    },
  });
  revalidatePath(`/reports/${reportId}`);
  return { token };
}

export async function unpublishReportCard(reportId: string) {
  const teacher = await requireAuthenticatedTeacher();
  const result = await db.reportCard.updateMany({
    where: { id: reportId, evaluation: { submission: { teacherId: teacher.id } } },
    data: { status: "DRAFT", publishTokenHash: null, publishedAt: null },
  });
  if (result.count !== 1) throw new Error("Report not found.");
  revalidatePath(`/reports/${reportId}`);
}

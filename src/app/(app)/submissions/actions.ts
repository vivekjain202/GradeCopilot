"use server";

import { randomUUID } from "crypto";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";
import { createSubmissionUploadUrl } from "@/lib/storage";
import {
  completeSubmissionUploadSchema,
  submissionMetadataSchema,
  type SubmissionMetadata,
} from "@/lib/submissions/schema";
import {
  retrySubmission,
  teacherOwnsSubmissionContext,
} from "@/lib/submissions/repository";

export type PreparedSubmissionUpload = {
  fileKey: string;
  signedUrl: string;
};

export async function prepareSubmissionUpload(
  input: SubmissionMetadata,
): Promise<PreparedSubmissionUpload> {
  const teacher = await requireAuthenticatedTeacher();
  const parsed = submissionMetadataSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Upload a PDF, JPEG, or PNG test copy up to 20 MB.");
  }

  if (
    !(await teacherOwnsSubmissionContext(
      teacher.id,
      parsed.data.testId,
      parsed.data.studentId,
    ))
  ) {
    throw new Error("Select a student and test from your account.");
  }

  const safeFileName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `${teacher.id}/${parsed.data.testId}/${parsed.data.studentId}/${randomUUID()}-${safeFileName}`;
  const upload = await createSubmissionUploadUrl(fileKey);

  return { fileKey, signedUrl: upload.signedUrl };
}

export async function completeSubmissionUpload(input: unknown) {
  const teacher = await requireAuthenticatedTeacher();
  const parsed = completeSubmissionUploadSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("The uploaded test copy is invalid.");
  }

  if (!parsed.data.fileKey.startsWith(`${teacher.id}/`)) {
    throw new Error("You do not have permission to attach this file.");
  }

  if (
    !(await teacherOwnsSubmissionContext(
      teacher.id,
      parsed.data.testId,
      parsed.data.studentId,
    ))
  ) {
    throw new Error("Select a student and test from your account.");
  }

  const submission = await db.submission.create({
    data: { ...parsed.data, teacherId: teacher.id },
  });

  revalidatePath("/submissions");
  return { submissionId: submission.id };
}

export async function retrySubmissionAction(submissionId: string) {
  const teacher = await requireAuthenticatedTeacher();
  const result = await retrySubmission(teacher.id, submissionId);

  if (result.count !== 1) {
    throw new Error("This submission cannot be retried.");
  }

  revalidatePath("/submissions");
}

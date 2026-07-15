"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { db } from "@/lib/db";
import { submissionBucket, storage } from "@/lib/storage";
import { submissionMetadataSchema } from "@/lib/submissions/schema";
import { teacherOwnsSubmissionContext } from "@/lib/submissions/repository";

export async function uploadSubmissionAction(formData: FormData) {
  const teacher = await requireAuthenticatedTeacher();
  const file = formData.get("file");
  const parsed = submissionMetadataSchema.safeParse({ testId: formData.get("testId"), studentId: formData.get("studentId"), fileName: file instanceof File ? file.name : "", mimeType: file instanceof File ? file.type : "", fileSizeBytes: file instanceof File ? file.size : 0 });
  if (!parsed.success || !(file instanceof File)) throw new Error("Upload a PDF, JPEG, or PNG test copy up to 20 MB.");
  if (!(await teacherOwnsSubmissionContext(teacher.id, parsed.data.testId, parsed.data.studentId))) throw new Error("Invalid test or student.");
  const fileKey = `${teacher.id}/${parsed.data.testId}/${parsed.data.studentId}/${randomUUID()}-${parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await storage.storage.from(submissionBucket).upload(fileKey, file, { contentType: parsed.data.mimeType, upsert: false });
  if (error) throw new Error("The test copy could not be stored securely.");
  await db.submission.create({ data: { ...parsed.data, teacherId: teacher.id, fileKey } });
  revalidatePath("/submissions");
  redirect("/submissions");
}

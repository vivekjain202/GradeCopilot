import "server-only";
import { db } from "@/lib/db";

export function listSubmissions(teacherId: string) {
  return db.submission.findMany({ where: { teacherId }, include: { student: true, test: true }, orderBy: { createdAt: "desc" } });
}

export async function teacherOwnsSubmissionContext(teacherId: string, testId: string, studentId: string) {
  const [test, student] = await Promise.all([
    db.test.findFirst({ where: { id: testId, teacherId }, select: { id: true } }),
    db.student.findFirst({ where: { id: studentId, teacherId }, select: { id: true } }),
  ]);
  return Boolean(test && student);
}

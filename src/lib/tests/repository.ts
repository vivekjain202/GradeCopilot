import "server-only";

import { db } from "@/lib/db";
import type { TestInput } from "./schema";

export function listTests(teacherId: string) {
  return db.test.findMany({
    where: { teacherId },
    include: { _count: { select: { rubricQuestions: true } } },
    orderBy: { testDate: "desc" },
  });
}

export function createTest(teacherId: string, input: TestInput) {
  return db.test.create({
    data: {
      teacherId,
      title: input.title,
      subject: input.subject,
      className: input.className,
      testDate: input.testDate,
      totalMarks: input.totalMarks,
      rubricQuestions: {
        create: input.questions.map((question, index) => ({
          ...question,
          position: index + 1,
        })),
      },
    },
  });
}

import { z } from "zod";

const rubricQuestionSchema = z.object({
  label: z.string().trim().min(1, "Add a question label.").max(50),
  prompt: z.string().trim().min(1, "Add the question prompt.").max(5_000),
  expectedAnswer: z.string().trim().min(1, "Add an expected answer.").max(5_000),
  criteria: z.string().trim().min(1, "Add marking criteria.").max(5_000),
  maxMarks: z.coerce.number().int().positive("Marks must be at least 1.").max(1_000),
});

export const testSchema = z
  .object({
    title: z.string().trim().min(1, "Enter a test title.").max(200),
    subject: z.string().trim().min(1, "Enter a subject.").max(100),
    className: z.string().trim().min(1, "Enter a class or section.").max(100),
    testDate: z.coerce.date(),
    totalMarks: z.coerce
      .number()
      .int()
      .positive("Total marks must be at least 1.")
      .max(10_000),
    questions: z
      .array(rubricQuestionSchema)
      .min(1, "Add at least one rubric question.")
      .max(100),
  })
  .superRefine((value, context) => {
    const rubricTotal = value.questions.reduce(
      (total, question) => total + question.maxMarks,
      0,
    );

    if (rubricTotal !== value.totalMarks) {
      context.addIssue({
        code: "custom",
        path: ["totalMarks"],
        message: `Rubric marks total ${rubricTotal}; they must equal the test total.`,
      });
    }
  });

export type TestInput = z.infer<typeof testSchema>;

export type TestFormState = {
  fieldErrors?: Partial<
    Record<
      "title" | "subject" | "className" | "testDate" | "totalMarks" | "questions",
      string[]
    >
  >;
  formError?: string;
};

import { describe, expect, it } from "vitest";

import { testSchema } from "./schema";

const baseInput = {
  title: "Algebra quiz",
  subject: "Mathematics",
  className: "Grade 6A",
  testDate: "2026-07-15",
  totalMarks: 10,
  questions: [
    {
      label: "Q1",
      prompt: "Solve x + 2 = 5.",
      expectedAnswer: "x = 3",
      criteria: "One mark for isolating x.",
      maxMarks: 10,
    },
  ],
};

describe("test input", () => {
  it("accepts rubric marks that equal the total", () => {
    expect(testSchema.safeParse(baseInput).success).toBe(true);
  });

  it("rejects a rubric whose marks do not equal the total", () => {
    const result = testSchema.safeParse({
      ...baseInput,
      questions: [{ ...baseInput.questions[0], maxMarks: 8 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.totalMarks).toEqual([
        "Rubric marks total 8; they must equal the test total.",
      ]);
    }
  });
});

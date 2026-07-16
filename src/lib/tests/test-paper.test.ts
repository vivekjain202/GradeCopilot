import { describe, expect, it } from "vitest";

import { parseTestPaperText } from "./test-paper";

describe("test paper parsing", () => {
  it("extracts question numbers, prompts, and marks from digital PDF text", () => {
    const result = parseTestPaperText(
      "Mathematics Midterm\n1. Solve x + 2 = 5. [3 marks]\n2(a). Explain your method. [2 marks]",
    );
    expect(result.title).toBe("Mathematics Midterm");
    expect(result.questions).toEqual([
      { questionNumber: "1", label: "Q1", prompt: "Solve x + 2 = 5.", maxMarks: 3 },
      {
        questionNumber: "2(a)",
        label: "Q2(a)",
        prompt: "Explain your method.",
        maxMarks: 2,
      },
    ]);
  });
});

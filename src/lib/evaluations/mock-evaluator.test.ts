import { expect, it } from "vitest";
import { createDeterministicDraft } from "./mock-evaluator";
it("creates a zero-mark reviewable draft", () =>
  expect(
    createDeterministicDraft([
      { id: "q1", label: "Q1", maxMarks: 5, criteria: "Correct method" },
    ])[0]?.earnedMarksSuggested,
  ).toBe(0));

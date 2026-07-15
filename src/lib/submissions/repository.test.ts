import { describe, expect, it } from "vitest";

import { ProcessingStatus } from "@/generated/prisma/enums";

import { isSubmissionRetryable } from "./processing";

describe("submission processing", () => {
  it("only allows failed submissions to be retried", () => {
    expect(isSubmissionRetryable(ProcessingStatus.FAILED)).toBe(true);
    expect(isSubmissionRetryable(ProcessingStatus.QUEUED)).toBe(false);
    expect(isSubmissionRetryable(ProcessingStatus.READY)).toBe(false);
  });
});

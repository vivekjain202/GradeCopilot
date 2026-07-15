import { describe, expect, it } from "vitest";

import { maxSubmissionFileSizeBytes, submissionMetadataSchema } from "./schema";

const validMetadata = {
  testId: "ckq3n8eaz0000h7k5x3o9a1bc",
  studentId: "ckq3n8eaz0001h7k5x3o9a1bc",
  fileName: "maya-algebra.pdf",
  mimeType: "application/pdf",
  fileSizeBytes: 1024,
};

describe("submission metadata", () => {
  it("accepts a supported file within the size limit", () => {
    expect(submissionMetadataSchema.safeParse(validMetadata).success).toBe(true);
  });

  it("rejects an unsupported file type", () => {
    expect(
      submissionMetadataSchema.safeParse({
        ...validMetadata,
        mimeType: "application/msword",
      }).success,
    ).toBe(false);
  });

  it("rejects a file larger than 20 MB", () => {
    expect(
      submissionMetadataSchema.safeParse({
        ...validMetadata,
        fileSizeBytes: maxSubmissionFileSizeBytes + 1,
      }).success,
    ).toBe(false);
  });
});

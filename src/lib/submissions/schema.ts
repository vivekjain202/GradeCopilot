import { z } from "zod";

export const submissionMetadataSchema = z.object({
  testId: z.string().cuid(),
  studentId: z.string().cuid(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  fileSizeBytes: z.number().int().positive().max(20 * 1024 * 1024),
});

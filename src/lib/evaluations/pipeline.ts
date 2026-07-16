import { z } from "zod";

export const ocrResultSchema = z.object({
  pages: z.array(
    z.object({ pageNumber: z.number().int().positive(), text: z.string() }),
  ),
  unreadablePageNumbers: z.array(z.number().int().positive()),
});

export const evaluationResultSchema = z.object({
  questions: z.array(
    z.object({
      rubricQuestionId: z.string().cuid(),
      suggestedMarks: z.number().int().nonnegative(),
      rationale: z.string(),
      comments: z.array(z.string()),
    }),
  ),
});

export type OcrProvider = {
  extract(file: {
    signedUrl: string;
    mimeType: string;
  }): Promise<z.infer<typeof ocrResultSchema>>;
};

export type EvaluationProvider = {
  evaluate(input: {
    transcription: z.infer<typeof ocrResultSchema>;
    rubric: Array<{ id: string; prompt: string; criteria: string; maxMarks: number }>;
  }): Promise<z.infer<typeof evaluationResultSchema>>;
};

export class ProviderNotConfiguredError extends Error {
  constructor() {
    super("OCR and evaluation providers are not configured yet.");
  }
}

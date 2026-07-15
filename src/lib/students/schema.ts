import { z } from "zod";

const optionalText = z.string().trim().max(100).optional().or(z.literal(""));

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Enter the student's name.").max(100),
  className: z.string().trim().min(1, "Enter a class or section.").max(100),
  rollNumber: optionalText,
  guardianEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid guardian email address."))
    .optional()
    .or(z.literal("")),
});

export type StudentInput = z.infer<typeof studentSchema>;

export type StudentFormState = {
  fieldErrors?: Partial<Record<keyof StudentInput, string[]>>;
  formError?: string;
};

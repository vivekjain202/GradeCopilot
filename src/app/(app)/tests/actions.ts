"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { createTest } from "@/lib/tests/repository";
import { type TestFormState, testSchema } from "@/lib/tests/schema";

export async function createTestAction(
  _previousState: TestFormState,
  formData: FormData,
): Promise<TestFormState> {
  const teacher = await requireAuthenticatedTeacher();
  let questions: unknown;
  try {
    questions = JSON.parse(String(formData.get("questions")));
  } catch {
    return { formError: "Rubric questions could not be read." };
  }
  const result = testSchema.safeParse({
    title: formData.get("title"),
    subject: formData.get("subject"),
    className: formData.get("className"),
    testDate: formData.get("testDate"),
    totalMarks: formData.get("totalMarks"),
    questions,
  });
  if (!result.success) return { fieldErrors: result.error.flatten().fieldErrors };
  await createTest(teacher.id, result.data);
  revalidatePath("/tests");
  redirect("/tests");
}

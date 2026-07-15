"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedTeacher } from "@/lib/authorization";
import { createStudent, updateStudent } from "@/lib/students/repository";
import { type StudentFormState, studentSchema } from "@/lib/students/schema";

function studentFields(formData: FormData) {
  return {
    name: formData.get("name"),
    className: formData.get("className"),
    rollNumber: formData.get("rollNumber"),
    guardianEmail: formData.get("guardianEmail"),
  };
}

export async function createStudentAction(
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const teacher = await requireAuthenticatedTeacher();
  const result = studentSchema.safeParse(studentFields(formData));

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  await createStudent(teacher.id, result.data);
  revalidatePath("/students");
  redirect("/students");
}

export async function updateStudentAction(
  studentId: string,
  _previousState: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const teacher = await requireAuthenticatedTeacher();
  const result = studentSchema.safeParse(studentFields(formData));

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const updated = await updateStudent(teacher.id, studentId, result.data);
  if (updated.count !== 1) {
    return { formError: "Student record was not found." };
  }

  revalidatePath("/students");
  redirect("/students");
}

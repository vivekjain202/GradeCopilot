"use server";

import { redirect } from "next/navigation";

import { createSession, deleteSession } from "@/lib/auth/session";
import {
  type CredentialsFormState,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createTeacher, findTeacherByEmail } from "@/lib/teachers";

function getFields(formData: FormData) {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };
}

export async function signUp(
  _previousState: CredentialsFormState,
  formData: FormData,
): Promise<CredentialsFormState> {
  const result = signUpSchema.safeParse(getFields(formData));

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const existingTeacher = await findTeacherByEmail(result.data.email);

  if (existingTeacher) {
    return { formError: "An account with this email already exists." };
  }

  const { password, ...teacherInput } = result.data;

  let teacher;

  try {
    teacher = await createTeacher({
      ...teacherInput,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { formError: "An account with this email already exists." };
    }

    throw error;
  }

  await createSession({ sub: teacher.id, email: teacher.email });
  redirect("/dashboard");
}

export async function signIn(
  _previousState: CredentialsFormState,
  formData: FormData,
): Promise<CredentialsFormState> {
  const result = signInSchema.safeParse(getFields(formData));

  if (!result.success) {
    return { fieldErrors: result.error.flatten().fieldErrors };
  }

  const teacher = await findTeacherByEmail(result.data.email);

  if (!teacher || !(await verifyPassword(result.data.password, teacher.passwordHash))) {
    return { formError: "Invalid email or password." };
  }

  await createSession({ sub: teacher.id, email: teacher.email });
  redirect("/dashboard");
}

export async function signOut() {
  await deleteSession();
  redirect("/login");
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

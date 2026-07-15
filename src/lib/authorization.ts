import "server-only";

import { readSession } from "@/lib/auth/session";
import { AuthorizationError } from "@/lib/ownership";
import { findTeacherById } from "@/lib/teachers";

export async function getAuthenticatedTeacher() {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const teacher = await findTeacherById(session.sub);

  if (!teacher || teacher.email !== session.email) {
    return null;
  }

  return teacher;
}

export async function requireAuthenticatedTeacher() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    throw new AuthorizationError();
  }

  return teacher;
}

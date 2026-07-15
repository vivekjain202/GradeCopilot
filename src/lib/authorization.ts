import "server-only";

import { readSession } from "@/lib/auth/session";
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

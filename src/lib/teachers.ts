import "server-only";

import { db } from "@/lib/db";

export function findTeacherByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function findTeacherById(id: string) {
  return db.user.findUnique({ where: { id } });
}

export function createTeacher(input: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  return db.user.create({ data: input });
}

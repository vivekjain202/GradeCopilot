import "server-only";

import { db } from "@/lib/db";
import type { StudentInput } from "./schema";

function optionalValue(value: string | undefined) {
  return value || null;
}

export function listStudents(teacherId: string) {
  return db.student.findMany({
    where: { teacherId },
    orderBy: [{ className: "asc" }, { name: "asc" }],
  });
}

export function findStudent(teacherId: string, id: string) {
  return db.student.findFirst({ where: { id, teacherId } });
}

export function createStudent(teacherId: string, input: StudentInput) {
  return db.student.create({
    data: {
      teacherId,
      name: input.name,
      className: input.className,
      rollNumber: optionalValue(input.rollNumber),
      guardianEmail: optionalValue(input.guardianEmail),
    },
  });
}

export function updateStudent(teacherId: string, id: string, input: StudentInput) {
  return db.student.updateMany({
    where: { id, teacherId },
    data: {
      name: input.name,
      className: input.className,
      rollNumber: optionalValue(input.rollNumber),
      guardianEmail: optionalValue(input.guardianEmail),
    },
  });
}

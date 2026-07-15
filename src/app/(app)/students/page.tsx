import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { listStudents } from "@/lib/students/repository";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) redirect("/login");
  const students = await listStudents(teacher.id);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Students</p>
          <h1 className="text-3xl font-bold">Student directory</h1>
        </div>
        <Link
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white"
          href="/students/new"
        >
          Add student
        </Link>
      </div>
      {students.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed p-8 text-slate-600">
          No students yet. Add the first student for this class.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {students.map((student) => (
            <li className="rounded-xl border bg-white p-5" key={student.id}>
              <p className="font-semibold">{student.name}</p>
              <p className="text-sm text-slate-600">
                {student.className}
                {student.rollNumber ? ` · Roll ${student.rollNumber}` : ""}
              </p>
              <Link
                className="mt-3 inline-block text-sm font-medium text-indigo-700"
                href={`/students/${student.id}/edit`}
              >
                Edit student
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

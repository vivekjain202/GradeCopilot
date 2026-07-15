import Link from "next/link";
import { createStudentAction } from "../actions";
import { StudentForm } from "../_components/student-form";
export default function NewStudentPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link className="text-sm font-medium text-indigo-700" href="/students">
        ← Students
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Add student</h1>
      <div className="mt-8">
        <StudentForm action={createStudentAction} />
      </div>
    </main>
  );
}

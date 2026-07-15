import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { listStudents } from "@/lib/students/repository";
import { listTests } from "@/lib/tests/repository";
import { SubmissionUploadForm } from "./_components/submission-upload-form";

export const dynamic = "force-dynamic";

export default async function NewSubmissionPage() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    redirect("/login");
  }

  const [students, tests] = await Promise.all([
    listStudents(teacher.id),
    listTests(teacher.id),
  ]);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link className="text-sm font-medium text-indigo-700" href="/submissions">
        ← Test copies
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Upload test copy</h1>
      {students.length && tests.length ? (
        <SubmissionUploadForm
          students={students.map((student) => ({
            id: student.id,
            label: `${student.name} · ${student.className}`,
          }))}
          tests={tests.map((test) => ({ id: test.id, label: test.title }))}
        />
      ) : (
        <p className="mt-8 rounded-xl border border-dashed p-6 text-slate-600">
          Create at least one student and test before uploading a test copy.
        </p>
      )}
    </main>
  );
}

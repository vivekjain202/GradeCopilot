import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedTeacher } from "@/lib/authorization";
import { listTests } from "@/lib/tests/repository";
export const dynamic = "force-dynamic";
export default async function TestsPage() {
  const teacher = await getAuthenticatedTeacher();
  if (!teacher) redirect("/login");
  const tests = await listTests(teacher.id);
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-700">Tests</p>
          <h1 className="text-3xl font-bold">Tests and rubrics</h1>
        </div>
        <Link
          className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white"
          href="/tests/new"
        >
          Create test
        </Link>
      </div>
      {tests.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed p-8 text-slate-600">
          No tests yet. Create a rubric-based test to begin.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {tests.map((test) => (
            <li className="rounded-xl border bg-white p-5" key={test.id}>
              <p className="font-semibold">{test.title}</p>
              <p className="text-sm text-slate-600">
                {test.subject} · {test.className} · {test.totalMarks} marks
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {test._count.rubricQuestions} rubric questions
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

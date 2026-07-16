import Link from "next/link";
import { redirect } from "next/navigation";

import { getAuthenticatedTeacher } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    redirect("/login");
  }

  return (
    <main>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-medium text-indigo-700">Teacher workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {teacher.name}
        </h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Manage students and rubric-based tests from your secure workspace.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
          <p>Start by adding students, then create your first rubric-based test.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white"
              href="/submissions/new"
            >
              Upload a test copy
            </Link>
            <Link
              className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-800"
              href="/submissions"
            >
              View test copies
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

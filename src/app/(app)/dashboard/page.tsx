import { redirect } from "next/navigation";

import { signOut } from "@/app/(auth)/actions";
import { getAuthenticatedTeacher } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <p className="font-bold tracking-tight">GradeCopilot</p>
          <form action={signOut}>
            <button
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-sm font-medium text-indigo-700">Teacher workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Welcome, {teacher.name}
        </h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Your secure workspace is ready. Student, test, and rubric management is next.
        </p>
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
          No tests yet. Create your first test in the next milestone.
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/(auth)/actions";
import { getAuthenticatedTeacher } from "@/lib/authorization";

export default async function ApplicationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <Link className="font-bold tracking-tight" href="/dashboard">
            GradeCopilot
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-wrap gap-1 text-sm">
            <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/students">
              Students
            </Link>
            <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/tests">
              Tests
            </Link>
            <Link
              className="rounded-md px-3 py-2 hover:bg-slate-100"
              href="/submissions"
            >
              Test copies
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              href="/submissions/new"
            >
              Upload test copy
            </Link>
            <form action={signOut}>
              <button
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

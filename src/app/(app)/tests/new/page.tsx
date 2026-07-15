import Link from "next/link";
import { createTestAction } from "../actions";
import { TestForm } from "../_components/test-form";
export default function NewTestPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link className="text-sm font-medium text-indigo-700" href="/tests">
        ← Tests
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Create test and rubric</h1>
      <p className="mt-2 text-slate-600">
        Set the total marks, then ensure the rubric question marks add up exactly.
      </p>
      <div className="mt-8">
        <TestForm action={createTestAction} />
      </div>
    </main>
  );
}

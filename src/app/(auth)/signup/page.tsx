import Link from "next/link";

import { signUp } from "../actions";
import { CredentialsForm } from "../_components/credentials-form";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600 uppercase">
          GradeCopilot
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Create your teacher account
        </h1>
        <p className="mt-2 text-slate-600">
          Start reviewing student work with confidence.
        </p>
        <div className="mt-8">
          <CredentialsForm action={signUp} mode="sign-up" />
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            className="font-semibold text-indigo-700 hover:text-indigo-600"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

import Link from "next/link";

import { signIn } from "../actions";
import { CredentialsForm } from "../_components/credentials-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <AuthPage
      title="Welcome back"
      subtitle="Sign in to continue reviewing student work."
    >
      <CredentialsForm action={signIn} mode="sign-in" />
      <p className="text-center text-sm text-slate-600">
        New to GradeCopilot?{" "}
        <Link
          className="font-semibold text-indigo-700 hover:text-indigo-600"
          href="/signup"
        >
          Create an account
        </Link>
      </p>
    </AuthPage>
  );
}

function AuthPage({
  children,
  subtitle,
  title,
}: Readonly<{
  children: React.ReactNode;
  subtitle: string;
  title: string;
}>) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-[0.18em] text-indigo-600 uppercase">
          GradeCopilot
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 text-slate-600">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}

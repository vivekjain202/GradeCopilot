"use client";

import { useActionState } from "react";

import type { CredentialsFormState } from "@/lib/auth/credentials";

type CredentialsAction = (
  state: CredentialsFormState,
  formData: FormData,
) => Promise<CredentialsFormState>;

type CredentialsFormProps = {
  action: CredentialsAction;
  mode: "sign-in" | "sign-up";
};

const initialState: CredentialsFormState = {};

export function CredentialsForm({ action, mode }: CredentialsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignUp = mode === "sign-up";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {isSignUp ? (
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          error={state.fieldErrors?.name}
        />
      ) : null}
      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={isSignUp ? "new-password" : "current-password"}
        hint={
          isSignUp
            ? "At least 12 characters, with upper- and lowercase letters and a number."
            : undefined
        }
        error={state.fieldErrors?.password}
      />
      {state.formError ? (
        <p className="text-sm text-rose-700">{state.formError}</p>
      ) : null}
      <button
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Please wait…" : isSignUp ? "Create teacher account" : "Sign in"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: "email" | "password" | "text";
  autoComplete: string;
  hint?: string;
  error?: string[];
}) {
  const errorId = `${name}-error`;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-800" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error || hint ? errorId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 ring-indigo-600 transition outline-none focus:ring-2"
        id={name}
        name={name}
        required
        type={type}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? (
        <p className="text-sm text-rose-700" id={errorId}>
          {error.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

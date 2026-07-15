"use client";

import { useActionState } from "react";

import type { StudentFormState, StudentInput } from "@/lib/students/schema";

type StudentAction = (
  state: StudentFormState,
  formData: FormData,
) => Promise<StudentFormState>;

const initialState: StudentFormState = {};

export function StudentForm({
  action,
  student,
}: {
  action: StudentAction;
  student?: StudentInput;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <Field
        label="Student name"
        name="name"
        defaultValue={student?.name}
        error={state.fieldErrors?.name}
        required
      />
      <Field
        label="Class / section"
        name="className"
        defaultValue={student?.className}
        error={state.fieldErrors?.className}
        required
      />
      <Field
        label="Roll number"
        name="rollNumber"
        defaultValue={student?.rollNumber}
        error={state.fieldErrors?.rollNumber}
      />
      <Field
        label="Guardian email"
        name="guardianEmail"
        type="email"
        defaultValue={student?.guardianEmail}
        error={state.fieldErrors?.guardianEmail}
      />
      {state.formError ? (
        <p className="text-sm text-rose-700">{state.formError}</p>
      ) : null}
      <button
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save student"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  required = false,
}: {
  label: string;
  name: string;
  type?: "email" | "text";
  defaultValue?: string;
  error?: string[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600"
        defaultValue={defaultValue}
        id={name}
        name={name}
        required={required}
        type={type}
      />
      {error ? <p className="text-sm text-rose-700">{error.join(" ")}</p> : null}
    </div>
  );
}

"use client";
import { useActionState, useState } from "react";
import type { TestFormState } from "@/lib/tests/schema";
const initialState: TestFormState = {};
const blankQuestion = () => ({
  label: "",
  prompt: "",
  expectedAnswer: "",
  criteria: "",
  maxMarks: 1,
});
export function TestForm({
  action,
}: {
  action: (state: TestFormState, data: FormData) => Promise<TestFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [questions, setQuestions] = useState([blankQuestion()]);
  const change = (index: number, field: string, value: string | number) =>
    setQuestions((current) =>
      current.map((question, position) =>
        position === index ? { ...question, [field]: value } : question,
      ),
    );
  return (
    <form action={formAction} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Test title" name="title" required />
        <Field label="Subject" name="subject" required />
        <Field label="Class / section" name="className" required />
        <Field label="Test date" name="testDate" type="date" required />
        <Field
          label="Total marks"
          name="totalMarks"
          type="number"
          required
          error={state.fieldErrors?.totalMarks}
        />
      </section>
      <input name="questions" type="hidden" value={JSON.stringify(questions)} />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rubric questions</h2>
          <button
            className="text-sm font-semibold text-indigo-700"
            onClick={() => setQuestions((current) => [...current, blankQuestion()])}
            type="button"
          >
            Add question
          </button>
        </div>
        {questions.map((question, index) => (
          <fieldset className="rounded-xl border p-4" key={index}>
            <legend className="px-1 text-sm font-medium">Question {index + 1}</legend>
            <div className="grid gap-3">
              <Input
                label="Label"
                value={question.label}
                onChange={(value) => change(index, "label", value)}
              />
              <Input
                label="Prompt"
                value={question.prompt}
                onChange={(value) => change(index, "prompt", value)}
                textarea
              />
              <Input
                label="Expected answer"
                value={question.expectedAnswer}
                onChange={(value) => change(index, "expectedAnswer", value)}
                textarea
              />
              <Input
                label="Marking criteria"
                value={question.criteria}
                onChange={(value) => change(index, "criteria", value)}
                textarea
              />
              <Input
                label="Maximum marks"
                value={question.maxMarks}
                onChange={(value) => change(index, "maxMarks", Number(value))}
                type="number"
              />
              {questions.length > 1 ? (
                <button
                  className="justify-self-start text-sm text-rose-700"
                  onClick={() =>
                    setQuestions((current) =>
                      current.filter((_, position) => position !== index),
                    )
                  }
                  type="button"
                >
                  Remove question
                </button>
              ) : null}
            </div>
          </fieldset>
        ))}
      </section>
      {state.formError ? (
        <p className="text-sm text-rose-700">{state.formError}</p>
      ) : null}
      {state.fieldErrors?.questions ? (
        <p className="text-sm text-rose-700">{state.fieldErrors.questions.join(" ")}</p>
      ) : null}
      <button
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Create test"}
      </button>
    </form>
  );
}
function Field({
  label,
  name,
  type = "text",
  required,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string[];
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        className="rounded-lg border border-slate-300 px-3 py-2"
        name={name}
        required={required}
        type={type}
      />
      {error ? <span className="text-rose-700">{error.join(" ")}</span> : null}
    </label>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  textarea = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      {textarea ? (
        <textarea
          className="rounded-lg border border-slate-300 px-3 py-2"
          onChange={(event) => onChange(event.target.value)}
          required
          value={value}
        />
      ) : (
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          onChange={(event) => onChange(event.target.value)}
          required
          type={type}
          value={value}
        />
      )}
    </label>
  );
}

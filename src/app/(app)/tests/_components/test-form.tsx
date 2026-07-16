"use client";

import { useActionState, useState } from "react";

import { extractTextFromPdf, parseTestPaperText } from "@/lib/tests/test-paper";
import type { TestFormState } from "@/lib/tests/schema";

const initialState: TestFormState = {};
const blankQuestion = () => ({
  questionNumber: "",
  label: "",
  prompt: "",
  expectedAnswer: "",
  criteria: "",
  maxMarks: 1,
});

type TestDetails = {
  title: string;
  subject: string;
  className: string;
  testDate: string;
  totalMarks: string;
};

export function TestForm({
  action,
}: {
  action: (state: TestFormState, data: FormData) => Promise<TestFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [details, setDetails] = useState<TestDetails>({
    title: "",
    subject: "",
    className: "",
    testDate: "",
    totalMarks: "",
  });
  const [questions, setQuestions] = useState([blankQuestion()]);
  const [paperMessage, setPaperMessage] = useState<string>();
  const change = (
    index: number,
    field: keyof ReturnType<typeof blankQuestion>,
    value: string | number,
  ) =>
    setQuestions((current) =>
      current.map((question, position) =>
        position === index ? { ...question, [field]: value } : question,
      ),
    );

  async function prefillFromPaper(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 20 * 1024 * 1024) {
      setPaperMessage("Choose a digital PDF test paper up to 20 MB.");
      return;
    }
    setPaperMessage("Reading available text from the PDF…");
    try {
      const parsed = parseTestPaperText(await extractTextFromPdf(file));
      if (!parsed.questions.length) {
        setPaperMessage(
          "No question text was found. This may be a scanned PDF; add questions manually or configure OCR later.",
        );
        return;
      }
      setDetails((current) => ({
        ...current,
        title: current.title || parsed.title,
        totalMarks:
          current.totalMarks ||
          String(
            parsed.questions.reduce((total, question) => total + question.maxMarks, 0),
          ),
      }));
      setQuestions(
        parsed.questions.map((question) => ({
          ...question,
          expectedAnswer: "",
          criteria: "",
        })),
      );
      setPaperMessage(
        "Questions were prefilled from the PDF. Review every field and add expected answers and criteria before saving.",
      );
    } catch {
      setPaperMessage(
        "The PDF could not be read. For scanned papers, add questions manually until OCR is configured.",
      );
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50/40 p-4">
        <label
          className="grid gap-1.5 text-sm font-medium text-slate-800"
          htmlFor="test-paper"
        >
          Test paper PDF (optional prefill)
          <input
            accept="application/pdf"
            id="test-paper"
            onChange={(event) => prefillFromPaper(event.target.files?.[0])}
            type="file"
          />
        </label>
        <p className="mt-2 text-sm text-slate-600">
          Digital PDFs are read locally to suggest title, question numbers, prompts, and
          marks. The source PDF is not saved; scanned PDFs need OCR, which is not
          configured yet.
        </p>
        {paperMessage ? (
          <p aria-live="polite" className="mt-2 text-sm text-indigo-800">
            {paperMessage}
          </p>
        ) : null}
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Test title"
          name="title"
          onChange={(title) => setDetails((current) => ({ ...current, title }))}
          required
          value={details.title}
        />
        <Field
          label="Subject"
          name="subject"
          onChange={(subject) => setDetails((current) => ({ ...current, subject }))}
          required
          value={details.subject}
        />
        <Field
          label="Class / section"
          name="className"
          onChange={(className) => setDetails((current) => ({ ...current, className }))}
          required
          value={details.className}
        />
        <Field
          label="Test date"
          name="testDate"
          onChange={(testDate) => setDetails((current) => ({ ...current, testDate }))}
          required
          type="date"
          value={details.testDate}
        />
        <Field
          error={state.fieldErrors?.totalMarks}
          label="Total marks"
          name="totalMarks"
          onChange={(totalMarks) =>
            setDetails((current) => ({ ...current, totalMarks }))
          }
          required
          type="number"
          value={details.totalMarks}
        />
      </section>
      <input name="questions" type="hidden" value={JSON.stringify(questions)} />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Rubric questions</h2>
            <p className="text-sm text-slate-600">
              Question number must match the identifier students write beside their
              answer.
            </p>
          </div>
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
                label="Question number students will use"
                onChange={(value) => change(index, "questionNumber", value)}
                value={question.questionNumber}
              />
              <Input
                label="Label"
                onChange={(value) => change(index, "label", value)}
                value={question.label}
              />
              <Input
                label="Prompt"
                onChange={(value) => change(index, "prompt", value)}
                textarea
                value={question.prompt}
              />
              <Input
                label="Expected answer"
                onChange={(value) => change(index, "expectedAnswer", value)}
                textarea
                value={question.expectedAnswer}
              />
              <Input
                label="Marking criteria"
                onChange={(value) => change(index, "criteria", value)}
                textarea
                value={question.criteria}
              />
              <Input
                label="Maximum marks"
                onChange={(value) => change(index, "maxMarks", Number(value))}
                type="number"
                value={question.maxMarks}
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
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        className="rounded-lg border border-slate-300 px-3 py-2"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
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

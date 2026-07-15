"use client";

import { useState } from "react";

type Thread = { id: string; label: string; body: string; status: "OPEN" | "RESOLVED" };
type Question = {
  id: string;
  label: string;
  maxMarks: number;
  marks: number;
  rationale: string;
};

export function EvaluationWorkspace({
  initialQuestions,
  initialThreads,
}: {
  initialQuestions: Question[];
  initialThreads: Thread[];
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [threads] = useState(initialThreads);
  const [selectedThread, setSelectedThread] = useState<string | null>(
    threads[0]?.id ?? null,
  );
  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-xl border bg-white">
        <header className="border-b p-5">
          <h1 className="text-xl font-bold">Evaluation draft</h1>
          <p className="text-sm text-slate-600">
            Review suggested marks and feedback before finalizing.
          </p>
        </header>
        <div className="space-y-5 p-5">
          {questions.map((question) => (
            <article className="rounded-lg border p-4" key={question.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <button
                    className="text-left font-semibold hover:text-indigo-700"
                    onClick={() =>
                      setSelectedThread(
                        threads.find((thread) => thread.label === question.label)?.id ??
                          null,
                      )
                    }
                    type="button"
                  >
                    {question.label}
                  </button>
                  <p className="mt-2 text-sm text-slate-600">{question.rationale}</p>
                </div>
                <label className="text-sm font-medium">
                  Marks
                  <input
                    className="mt-1 block w-20 rounded border px-2 py-1"
                    max={question.maxMarks}
                    min={0}
                    onChange={(event) =>
                      setQuestions((current) =>
                        current.map((item) =>
                          item.id === question.id
                            ? { ...item, marks: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                    type="number"
                    value={question.marks}
                  />{" "}
                  / {question.maxMarks}
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="rounded-xl border bg-white">
        <header className="border-b p-5">
          <h2 className="font-bold">Comments</h2>
          <p className="text-sm text-slate-600">Feedback stays tied to its question.</p>
        </header>
        <div className="divide-y">
          {threads.map((thread) => (
            <button
              className={`block w-full p-4 text-left ${selectedThread === thread.id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              type="button"
            >
              <p className="text-sm font-semibold">{thread.label}</p>
              <p className="mt-1 text-sm text-slate-600">{thread.body}</p>
              <span className="mt-2 inline-block text-xs font-medium text-indigo-700">
                {thread.status === "OPEN" ? "Open" : "Resolved"}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";

import {
  createCommentThread,
  deleteCommentThread,
  resolveCommentThread,
  updateEvaluationAnswer,
  updateEvaluationMarks,
} from "@/app/(app)/evaluations/[evaluationId]/actions";

type Anchor = { from: number; to: number; quote: string };

type Thread = {
  id: string;
  questionId: string | null;
  label: string;
  body: string;
  status: "OPEN" | "RESOLVED" | "ORPHANED";
  anchor: unknown;
};

type Question = {
  id: string;
  label: string;
  maxMarks: number;
  marks: number;
  rationale: string;
  answerContent: unknown;
};

type EvaluationWorkspaceProps = {
  evaluationId: string;
  initialQuestions: Question[];
  initialThreads: Thread[];
};

export function EvaluationWorkspace({
  evaluationId,
  initialQuestions,
  initialThreads,
}: EvaluationWorkspaceProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    initialQuestions[0]?.id ?? "",
  );
  const [selectedAnchor, setSelectedAnchor] = useState<Anchor>();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const selectedQuestion = questions.find(
    (question) => question.id === selectedQuestionId,
  );
  const selectedThreads = initialThreads.filter(
    (thread) => thread.questionId === selectedQuestionId,
  );
  const total = questions.reduce((sum, question) => sum + question.marks, 0);
  const maxTotal = questions.reduce((sum, question) => sum + question.maxMarks, 0);

  function runMutation(action: () => Promise<unknown>) {
    setError(undefined);
    startTransition(async () => {
      try {
        await action();
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Your change could not be saved. Please try again.",
        );
      }
    });
  }

  function createThread() {
    if (!selectedQuestion || !comment.trim()) {
      setError("Select an answer and add a comment before saving.");
      return;
    }

    const anchor = selectedAnchor ?? { from: 0, to: 0, quote: "" };
    runMutation(async () => {
      await createCommentThread({
        evaluationId,
        questionId: selectedQuestion.id,
        body: comment,
        anchor,
      });
      setComment("");
      setSelectedAnchor(undefined);
    });
  }

  return (
    <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-xl border bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <div>
            <h1 className="text-xl font-bold">Evaluation draft</h1>
            <p className="text-sm text-slate-600">
              Review the transcription, marks, and feedback before finalizing.
            </p>
          </div>
          <p className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
            {total} / {maxTotal}
          </p>
        </header>
        <div className="space-y-5 p-5">
          {questions.map((question) => (
            <QuestionEditor
              key={question.id}
              onAnswerChange={(content) =>
                runMutation(() =>
                  updateEvaluationAnswer(evaluationId, question.id, content),
                )
              }
              onMarksChange={(marks) => {
                setQuestions((current) =>
                  current.map((item) =>
                    item.id === question.id ? { ...item, marks } : item,
                  ),
                );
                runMutation(() =>
                  updateEvaluationMarks(evaluationId, question.id, marks),
                );
              }}
              onSelectAnchor={(anchor) => {
                setSelectedQuestionId(question.id);
                setSelectedAnchor(anchor);
              }}
              onSelectQuestion={() => setSelectedQuestionId(question.id)}
              question={question}
              selected={selectedQuestionId === question.id}
            />
          ))}
        </div>
      </section>
      <aside className="rounded-xl border bg-white">
        <header className="border-b p-5">
          <h2 className="font-bold">Anchored comments</h2>
          <p className="text-sm text-slate-600">
            {selectedAnchor?.quote
              ? `Selected: “${selectedAnchor.quote}”`
              : "Select answer text to anchor a new comment."}
          </p>
        </header>
        <div className="space-y-4 p-4">
          <label
            className="grid gap-1 text-sm font-medium text-slate-800"
            htmlFor="comment"
          >
            New comment{selectedQuestion ? ` · ${selectedQuestion.label}` : ""}
            <textarea
              className="min-h-24 rounded-lg border border-slate-300 p-2 font-normal"
              id="comment"
              onChange={(event) => setComment(event.target.value)}
              value={comment}
            />
          </label>
          <button
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isPending || !selectedQuestion}
            onClick={createThread}
            type="button"
          >
            Add anchored comment
          </button>
          {error ? (
            <p aria-live="polite" className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className="divide-y border-t">
          {selectedThreads.length ? (
            selectedThreads.map((thread) => (
              <article className="space-y-2 p-4" key={thread.id}>
                <p className="text-sm font-semibold">{thread.label}</p>
                <p className="text-sm text-slate-700">{thread.body}</p>
                {thread.status === "ORPHANED" ? (
                  <p className="text-xs font-medium text-amber-700">
                    The original selection changed. Review this anchor.
                  </p>
                ) : null}
                <div className="flex gap-3 text-sm">
                  {thread.status === "OPEN" ? (
                    <button
                      className="font-medium text-indigo-700"
                      onClick={() =>
                        runMutation(() => resolveCommentThread(evaluationId, thread.id))
                      }
                      type="button"
                    >
                      Resolve
                    </button>
                  ) : null}
                  <button
                    className="font-medium text-rose-700"
                    onClick={() =>
                      runMutation(() => deleteCommentThread(evaluationId, thread.id))
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="p-4 text-sm text-slate-600">
              No comments for this answer yet.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function QuestionEditor({
  onAnswerChange,
  onMarksChange,
  onSelectAnchor,
  onSelectQuestion,
  question,
  selected,
}: {
  onAnswerChange: (content: JSONContent) => void;
  onMarksChange: (marks: number) => void;
  onSelectAnchor: (anchor: Anchor | undefined) => void;
  onSelectQuestion: () => void;
  question: Question;
  selected: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: question.answerContent as JSONContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-28 rounded-b-lg border border-slate-300 p-3 text-sm leading-6 outline-none focus:border-indigo-500",
      },
    },
    onBlur: ({ editor: currentEditor }) => onAnswerChange(currentEditor.getJSON()),
    onFocus: onSelectQuestion,
    onSelectionUpdate: ({ editor: currentEditor }) => {
      const { from, to } = currentEditor.state.selection;
      const quote = currentEditor.state.doc.textBetween(from, to, " ");
      onSelectAnchor(quote ? { from, to, quote } : undefined);
    },
  });

  return (
    <article
      className={`rounded-lg border p-4 ${selected ? "border-indigo-300 ring-1 ring-indigo-100" : ""}`}
      onClick={onSelectQuestion}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{question.label}</h2>
          <p className="mt-1 text-sm text-slate-600">{question.rationale}</p>
        </div>
        <label className="text-sm font-medium" htmlFor={`marks-${question.id}`}>
          Marks
          <input
            className="mt-1 block w-20 rounded border border-slate-300 px-2 py-1"
            id={`marks-${question.id}`}
            max={question.maxMarks}
            min={0}
            onChange={(event) => onMarksChange(Number(event.target.value))}
            type="number"
            value={question.marks}
          />
          <span className="text-slate-500"> / {question.maxMarks}</span>
        </label>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-slate-800">Answer transcription</p>
        <div className="flex gap-2 rounded-t-lg border border-b-0 border-slate-300 bg-slate-50 p-2">
          <button
            className="rounded px-2 py-1 text-sm font-semibold hover:bg-white"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            type="button"
          >
            B
          </button>
          <button
            className="rounded px-2 py-1 text-sm italic hover:bg-white"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            type="button"
          >
            I
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </article>
  );
}

"use client";

import { useState, useTransition } from "react";

import { saveReportCard } from "../actions";

type ReportEditorProps = {
  reportId: string;
  initialReport: {
    summary: string;
    strengths: string[];
    improvementAreas: string[];
    nextSteps: string[];
    teacherNote: string;
  };
};

export function ReportEditor({ reportId, initialReport }: ReportEditorProps) {
  const [report, setReport] = useState(initialReport);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(undefined);
    startTransition(async () => {
      try {
        await saveReportCard(reportId, report);
        setMessage("Saved as a new report version.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Report could not be saved.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <TextField
        label="Summary"
        onChange={(summary) => setReport((current) => ({ ...current, summary }))}
        value={report.summary}
      />
      <ListField
        label="Strengths"
        onChange={(strengths) => setReport((current) => ({ ...current, strengths }))}
        values={report.strengths}
      />
      <ListField
        label="Areas for improvement"
        onChange={(improvementAreas) =>
          setReport((current) => ({ ...current, improvementAreas }))
        }
        values={report.improvementAreas}
      />
      <ListField
        label="Next steps"
        onChange={(nextSteps) => setReport((current) => ({ ...current, nextSteps }))}
        values={report.nextSteps}
      />
      <TextField
        label="Teacher note (optional)"
        onChange={(teacherNote) =>
          setReport((current) => ({ ...current, teacherNote }))
        }
        value={report.teacherNote}
      />
      {message ? (
        <p aria-live="polite" className="text-sm text-slate-700">
          {message}
        </p>
      ) : null}
      <button
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        disabled={isPending}
        onClick={save}
        type="button"
      >
        {isPending ? "Saving…" : "Save report version"}
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-800">
      {label}
      <textarea
        className="min-h-28 rounded-lg border border-slate-300 p-3 font-normal"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-800">
      {label}
      <textarea
        className="min-h-28 rounded-lg border border-slate-300 p-3 font-normal"
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((value) => value.trim())
              .filter(Boolean),
          )
        }
        value={values.join("\n")}
      />
      <span className="text-xs font-normal text-slate-500">One item per line.</span>
    </label>
  );
}

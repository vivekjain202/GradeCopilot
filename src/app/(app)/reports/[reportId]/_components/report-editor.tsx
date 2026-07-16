"use client";

import { useState, useTransition } from "react";

import { publishReportCard, saveReportCard, unpublishReportCard } from "../actions";

type ReportEditorProps = {
  reportId: string;
  initialReport: {
    summary: string;
    strengths: string[];
    improvementAreas: string[];
    nextSteps: string[];
    teacherNote: string;
  };
  status: "DRAFT" | "PUBLISHED";
};

export function ReportEditor({ reportId, initialReport, status }: ReportEditorProps) {
  const [report, setReport] = useState(initialReport);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [shareUrl, setShareUrl] = useState<string>();

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

  function togglePublishing() {
    setMessage(undefined);
    startTransition(async () => {
      try {
        if (status === "PUBLISHED") {
          await unpublishReportCard(reportId);
          setShareUrl(undefined);
          setMessage("Report link revoked.");
        } else {
          const { token } = await publishReportCard(reportId);
          setShareUrl(`${window.location.origin}/r/${token}`);
          setMessage("Report published. Copy the private link below now.");
        }
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Publishing could not be updated.",
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
      <button
        className="ml-3 rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-800 disabled:opacity-60"
        disabled={isPending}
        onClick={togglePublishing}
        type="button"
      >
        {status === "PUBLISHED" ? "Unpublish and revoke link" : "Publish private link"}
      </button>
      {shareUrl ? (
        <label className="mt-4 grid gap-1 text-sm font-medium text-slate-800">
          Private share link
          <input
            className="rounded-lg border border-slate-300 p-2 font-normal"
            readOnly
            value={shareUrl}
          />
        </label>
      ) : null}
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

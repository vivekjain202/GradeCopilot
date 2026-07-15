"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  completeSubmissionUpload,
  prepareSubmissionUpload,
} from "@/app/(app)/submissions/actions";
import {
  maxSubmissionFileSizeBytes,
  submissionMetadataSchema,
} from "@/lib/submissions/schema";

type UploadOption = {
  id: string;
  label: string;
};

type SubmissionUploadFormProps = {
  students: UploadOption[];
  tests: UploadOption[];
};

export function SubmissionUploadForm({ students, tests }: SubmissionUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setError("Choose a test copy to upload.");
      return;
    }

    const metadata = submissionMetadataSchema.safeParse({
      testId: formData.get("testId"),
      studentId: formData.get("studentId"),
      fileName: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    });

    if (!metadata.success) {
      setError("Choose a PDF, JPEG, or PNG file up to 20 MB.");
      return;
    }

    setError(undefined);
    setProgress(0);
    startTransition(async () => {
      try {
        const upload = await prepareSubmissionUpload(metadata.data);
        await uploadFile(upload.signedUrl, file, setProgress);
        await completeSubmissionUpload({ ...metadata.data, fileKey: upload.fileKey });
        router.push("/submissions");
      } catch (uploadError) {
        setProgress(undefined);
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "The test copy could not be uploaded. Please try again.",
        );
      }
    });
  }

  return (
    <form action={handleSubmit} className="mt-8 space-y-5" noValidate>
      <label
        className="grid gap-1 text-sm font-medium text-slate-800"
        htmlFor="studentId"
      >
        Student
        <select
          className="rounded-lg border border-slate-300 bg-white p-2"
          id="studentId"
          name="studentId"
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-800" htmlFor="testId">
        Test
        <select
          className="rounded-lg border border-slate-300 bg-white p-2"
          id="testId"
          name="testId"
        >
          {tests.map((test) => (
            <option key={test.id} value={test.id}>
              {test.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-800" htmlFor="file">
        Test copy
        <input
          accept="application/pdf,image/jpeg,image/png"
          id="file"
          name="file"
          ref={fileInputRef}
          required
          type="file"
        />
      </label>
      <p className="text-sm text-slate-600">
        PDF, JPEG, or PNG up to {formatFileSize(maxSubmissionFileSizeBytes)}. Files are
        transferred directly to a private storage bucket.
      </p>
      {progress !== undefined ? (
        <div aria-live="polite" className="space-y-1" role="status">
          <progress className="w-full" max="100" value={progress} />
          <p className="text-sm text-slate-600">Uploading: {progress}%</p>
        </div>
      ) : null}
      {error ? (
        <p aria-live="polite" className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Preparing upload…" : "Upload securely"}
      </button>
    </form>
  );
}

function uploadFile(
  signedUrl: string,
  file: File,
  onProgress: (value: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", signedUrl);
    request.setRequestHeader("content-type", file.type);
    request.setRequestHeader("x-upsert", "false");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("The storage upload failed.")),
    );
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(new Error("The storage upload was not accepted."));
      }
    });
    request.send(file);
  });
}

function formatFileSize(bytes: number) {
  return `${bytes / 1024 / 1024} MB`;
}

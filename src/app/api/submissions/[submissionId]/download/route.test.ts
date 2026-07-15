import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthenticatedTeacher = vi.fn();
const findSubmissionByTeacher = vi.fn();
const createSubmissionDownloadUrl = vi.fn();

vi.mock("@/lib/authorization", () => ({ getAuthenticatedTeacher }));
vi.mock("@/lib/submissions/repository", () => ({ findSubmissionByTeacher }));
vi.mock("@/lib/storage", () => ({ createSubmissionDownloadUrl }));

const { GET } = await import("./route");

describe("submission download route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects an unauthenticated request", async () => {
    getAuthenticatedTeacher.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/submissions/submission-id/download"),
      {
        params: Promise.resolve({ submissionId: "submission-id" }),
      },
    );

    expect(response.status).toBe(401);
    expect(findSubmissionByTeacher).not.toHaveBeenCalled();
  });

  it("does not issue a signed URL when the teacher does not own the submission", async () => {
    getAuthenticatedTeacher.mockResolvedValue({ id: "teacher-id" });
    findSubmissionByTeacher.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/submissions/other/download"),
      {
        params: Promise.resolve({ submissionId: "other" }),
      },
    );

    expect(response.status).toBe(404);
    expect(findSubmissionByTeacher).toHaveBeenCalledWith("teacher-id", "other");
    expect(createSubmissionDownloadUrl).not.toHaveBeenCalled();
  });

  it("redirects an owning teacher to a short-lived storage URL", async () => {
    getAuthenticatedTeacher.mockResolvedValue({ id: "teacher-id" });
    findSubmissionByTeacher.mockResolvedValue({ fileKey: "teacher-id/file.pdf" });
    createSubmissionDownloadUrl.mockResolvedValue(
      "https://storage.example.test/signed-url",
    );

    const response = await GET(
      new Request("http://localhost/api/submissions/owned/download"),
      {
        params: Promise.resolve({ submissionId: "owned" }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://storage.example.test/signed-url",
    );
  });
});

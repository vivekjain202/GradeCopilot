import { NextResponse } from "next/server";

import { getAuthenticatedTeacher } from "@/lib/authorization";
import { createSubmissionDownloadUrl } from "@/lib/storage";
import { findSubmissionByTeacher } from "@/lib/submissions/repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/submissions/[submissionId]/download">,
) {
  const teacher = await getAuthenticatedTeacher();

  if (!teacher) {
    return new NextResponse("Authentication required.", { status: 401 });
  }

  const { submissionId } = await context.params;
  const submission = await findSubmissionByTeacher(teacher.id, submissionId);

  if (!submission) {
    return new NextResponse("Submission not found.", { status: 404 });
  }

  const signedUrl = await createSubmissionDownloadUrl(submission.fileKey);
  return NextResponse.redirect(signedUrl);
}

import "server-only";

import { db } from "@/lib/db";

export function enqueueProcessingJob(submissionId: string) {
  return db.processingJob.upsert({
    where: { submissionId },
    create: { submissionId },
    update: { status: "QUEUED", errorCode: null },
  });
}

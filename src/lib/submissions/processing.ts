import { ProcessingStatus } from "@/generated/prisma/enums";

export function isSubmissionRetryable(status: ProcessingStatus) {
  return status === ProcessingStatus.FAILED;
}

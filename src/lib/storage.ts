import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/env";

export const submissionBucket = "test-copies";

export const storage = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function createSubmissionUploadUrl(fileKey: string) {
  const { data, error } = await storage.storage
    .from(submissionBucket)
    .createSignedUploadUrl(fileKey);

  if (error) throw new Error("Could not prepare a secure upload URL.");
  return data;
}

export async function createSubmissionDownloadUrl(fileKey: string) {
  const { data, error } = await storage.storage
    .from(submissionBucket)
    .createSignedUrl(fileKey, 60);

  if (error) throw new Error("Could not prepare a secure download URL.");
  return data.signedUrl;
}

# GradeCopilot Operations Runbook

## Production release

1. Protect `master`; deploy only from reviewed pull requests.
2. In Vercel, configure production values for `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `SESSION_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `CRON_SECRET`. Optionally set `OPENAI_MODEL` to a model available to the OpenAI project.
3. Use a separate Supabase production project and private `test-copies` bucket.
4. Before releasing application code that depends on a migration, run `npm run db:deploy` with production `DIRECT_URL`.
5. Confirm the Vercel deployment passes its build and check sign-in, upload, AI draft creation, evaluation finalization, and a published-report link.

## Data protection

- Keep submission files in the private `test-copies` bucket. Never add public-read access.
- Rotate `SESSION_SECRET` only through a planned session-expiry event.
- Rotate Supabase service-role keys immediately if exposed, then update Vercel environment values.
- Supabase database backups and point-in-time recovery must be enabled for production.

## Monitoring and incidents

- Use Vercel deployment/function logs and Supabase logs for operational errors. Do not log test-copy URLs, student answer text, passwords, share tokens, database URLs, or service-role keys.
- Alert on repeated `FAILED` submissions and database connection failures.
- A revoked report link is handled by unpublishing the report; this deletes its token hash and makes the old link return 404.

## AI processing

- Vercel Cron invokes `/api/internal/process-jobs` every five minutes. Vercel includes `Authorization: Bearer <CRON_SECRET>` when the `CRON_SECRET` environment variable is configured; do not expose this route publicly.
- Each invocation claims at most two jobs. The worker uses a short-lived Supabase Storage URL, sends the PDF or image to OpenAI for transcription, then requests a schema-constrained evaluation draft.
- AI output can only create a `DRAFT` evaluation. It cannot finalize an evaluation, publish a report, or replace an existing teacher draft.
- The UI receives generic failure messaging only. Keep raw OpenAI errors, test-copy URLs, and answer text out of application logs.
- Monitor failed jobs and OpenAI spend. Jobs are retryable by the teacher; after three attempts the teacher is told to retry when ready.

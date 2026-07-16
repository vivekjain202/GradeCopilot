# GradeCopilot Operations Runbook

## Production release

1. Protect `master`; deploy only from reviewed pull requests.
2. In Vercel, configure production values for `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `SESSION_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Use a separate Supabase production project and private `test-copies` bucket.
4. Before releasing application code that depends on a migration, run `npm run db:deploy` with production `DIRECT_URL`.
5. Confirm the Vercel deployment passes its build and check sign-in, upload, evaluation finalization, and a published-report link.

## Data protection

- Keep submission files in the private `test-copies` bucket. Never add public-read access.
- Rotate `SESSION_SECRET` only through a planned session-expiry event.
- Rotate Supabase service-role keys immediately if exposed, then update Vercel environment values.
- Supabase database backups and point-in-time recovery must be enabled for production.

## Monitoring and incidents

- Use Vercel deployment/function logs and Supabase logs for operational errors. Do not log test-copy URLs, student answer text, passwords, share tokens, database URLs, or service-role keys.
- Alert on repeated `FAILED` submissions and database connection failures.
- A revoked report link is handled by unpublishing the report; this deletes its token hash and makes the old link return 404.

## Deferred AI providers

The durable processing job queue and provider contracts are ready. Before enabling processing, choose and configure:

- an externally hosted open-source OCR provider/worker;
- an LLM provider for structured draft evaluation and comments;
- retry, timeout, and privacy-retention policies for those providers.

No OCR or LLM request is made until those adapters are intentionally added.

# GradeCopilot

GradeCopilot helps teachers review AI-assisted grading drafts, provide anchored feedback, and publish personalized student reports. AI suggestions are always drafts; the teacher is the final decision-maker.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS
- Supabase Postgres with Prisma
- Vitest and React Testing Library for unit tests
- Playwright for browser-level end-to-end tests
- Vercel for deployment

## Prerequisites

- Node.js 20.19+ (Node 22 LTS recommended)
- npm 10+
- A Supabase project (authentication stores teacher accounts in Postgres)

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`, then add your Supabase connection strings and a unique `SESSION_SECRET`.
3. Apply database migrations with `npm run db:deploy`.
4. Start the application with `npm run dev`.
5. Open `http://localhost:3000`, create a teacher account, and sign in.

`DATABASE_URL` should be the Supabase direct Postgres connection string. `DIRECT_URL` is reserved for Prisma migration commands and should use the direct database connection, rather than a pooled transaction URL.

## Commands

| Command                               | Purpose                                                |
| ------------------------------------- | ------------------------------------------------------ |
| `npm run dev`                         | Start the local Next.js server.                        |
| `npm run lint`                        | Run ESLint.                                            |
| `npm run format:check`                | Check formatting with Prettier.                        |
| `npm run typecheck`                   | Run strict TypeScript checks.                          |
| `npm run test`                        | Run unit tests once.                                   |
| `npm run test:e2e`                    | Run Playwright tests.                                  |
| `npm run build`                       | Produce a production build.                            |
| `npm run db:validate`                 | Validate the Prisma schema.                            |
| `npm run db:generate`                 | Generate the Prisma client.                            |
| `npm run db:migrate -- --name <name>` | Create and apply a development migration.              |
| `npm run db:deploy`                   | Apply committed migrations in deployment environments. |

## Environment and secrets

Never commit `.env.local`, database URLs, session secrets, Supabase service-role keys, or AI API keys. Configure production variables in Vercel, and use a separate Supabase project for production. Teacher passwords are salted and hashed before storage; the application only stores a signed, HTTP-only session cookie in the browser.

## Supabase Storage setup

Create a bucket named `test-copies` in the Supabase Storage dashboard before using uploads. It must remain **private**. Set its maximum file size to 20 MiB and allow only `application/pdf`, `image/jpeg`, and `image/png` when those bucket settings are available.

The browser receives a short-lived, server-created upload URL and uploads directly to that private bucket; it never receives the service-role key. Viewing a submission goes through the authenticated application, which verifies the teacher owns the submission before issuing a 60-second download URL. Do not add a public read policy for this bucket.

## Deployment

Vercel deploys the production branch (`master`). Before connecting the repository, set the required environment variables in Vercel and configure a Supabase production database. Apply migrations with `npm run db:deploy` as part of the deployment workflow.

## Project conventions

- Application routes live in `src/app`.
- Shared server-side modules live in `src/lib`.
- Prisma schema and migrations live in `prisma`.
- Unit tests are colocated with the code they cover as `*.test.ts` or `*.test.tsx`.
- Browser tests live in `tests`.

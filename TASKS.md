# GradeCopilot Engineering Task List

This backlog follows a vertical-slice approach: establish a reliable foundation first, then make the teacher’s core review workflow work with deterministic data before introducing asynchronous AI processing.

## Engineering standards

- Use TypeScript with strict type checking; avoid `any` in application code.
- Keep business logic separate from route/UI layers and validate external input at boundaries.
- Treat student submissions and reports as sensitive data: private storage, authenticated teacher routes, least-privilege access, and no public raw-file URLs.
- Make all AI output draft-only and reviewable; enforce rubric mark bounds server-side.
- Cover domain logic with unit tests and core teacher flows with end-to-end tests as they are introduced.
- Use database migrations, environment-variable validation, linting, formatting, and CI from the beginning.
- Prefer accessible, responsive UI primitives and clear empty/loading/error states.

## Delivery backlog

### 0. Project foundation — first task

- [x] Initialize a Next.js App Router project with TypeScript, ESLint, Prettier, Tailwind CSS, and a small accessible component foundation.
- [x] Add `.env.example` and typed environment validation without committing secrets.
- [x] Add Vitest for unit tests and Playwright for end-to-end tests, with one passing smoke test each.
- [x] Add Prisma configured for Supabase Postgres and create the initial migration workflow.
- [x] Add CI to run type checking, linting, unit tests, and build on pull requests.
- [x] Add a concise `README.md` covering local setup, required services, and test commands.

**Done when:** a new developer can clone the repository, configure local environment variables, run the app and automated checks, and see CI validate pull requests.

### 1. Authentication and protected application shell

- [x] Implement first-party teacher email/password sign-up and sign-in.
- [x] Protect application routes and redirect unauthenticated users.
- [x] Create an accessible dashboard shell with navigation, user menu, and empty states.
- [x] Define the `User` schema and ownership helpers.
- [x] Configure the Supabase project, apply the `users` migration, and manually verify sign-up, sign-in, sign-out, and a persistent session.

**Done when:** an authenticated teacher can access the dashboard while unauthenticated visitors cannot.

### 2. Students, tests, and rubrics

- [x] Create database models and migrations for students, tests, and rubric questions.
- [x] Build validated server-side CRUD operations scoped to the signed-in teacher.
- [x] Build student directory and create/edit student form.
- [x] Build test creation and rubric builder with question order, criteria, and maximum marks.
- [x] Add tests for validation, ownership, and total-mark constraints.
- [ ] Apply the migration to Supabase and manually verify teacher-scoped student and test CRUD.

**Done when:** a teacher can create a student and a rubric-based test, then view and edit them later.

### 3. Secure submission upload

- [ ] Configure a private Supabase Storage bucket for test copies.
- [x] Build PDF/JPG/PNG upload with file type and size validation.
- [x] Persist a submission record and processing state.
- [x] Use signed URLs only for teacher access; add authorization tests.
- [x] Build submission progress and retry/error UI states.

**Done when:** a teacher can securely upload one student test copy and see its processing status.

### 4. Evaluation workspace with deterministic draft data

- [ ] Define evaluation, evaluation-question, comment-thread, comment, and audit-version models.
- [ ] Create a deterministic mock evaluator that generates a repeatable draft from the rubric.
- [ ] Build the evaluation workspace: score summary, answer document, and anchored comment sidebar.
- [ ] Use Tiptap document anchors tied to answer/question blocks, including orphaned-anchor handling.
- [ ] Allow teachers to edit transcription, scores, and comments; create/resolve/delete threads.
- [ ] Validate marks against rubric limits and persist teacher changes safely.

**Done when:** a teacher can complete the full review experience without any live AI dependency.

### 5. Finalize evaluations and audit history

- [ ] Add explicit evaluation finalization with a confirmation flow.
- [ ] Snapshot the finalized evaluation and prevent accidental edits; support intentional reopen with audit entry.
- [ ] Show finalized status and basic history.

**Done when:** a teacher can confidently identify the exact approved marks and feedback used to create a report.

### 6. AI evaluation pipeline

- [ ] Configure an asynchronous job runner and idempotent processing jobs.
- [ ] Add OCR/vision extraction and structured AI evaluation responses.
- [ ] Validate all returned schemas, score limits, and references before persisting drafts.
- [ ] Surface uncertainty, unreadable content, retries, and failures clearly to the teacher.
- [ ] Add observability with privacy-conscious job/error metadata.

**Done when:** a real uploaded submission produces a reviewable, never-auto-finalized evaluation draft.

### 7. Report-card generation and teacher editor

- [ ] Create report-card schema, versioning, and generation request.
- [ ] Generate a structured report from finalized evaluation data only.
- [ ] Build an editable report editor for summary, strengths, improvement areas, next steps, and teacher note.
- [ ] Validate and snapshot the approved report version.

**Done when:** the teacher can create and revise a personalized report card from a finalized evaluation.

### 8. Publish and securely share reports

- [ ] Publish/unpublish report cards with high-entropy, revocable share tokens.
- [ ] Build a mobile-friendly, read-only public report view.
- [ ] Ensure report links never expose the raw student submission.
- [ ] Add tests for unpublished, revoked, and invalid share links.

**Done when:** a teacher can securely share a final report through a private link.

### 9. Production readiness

- [ ] Configure Vercel project environments and Supabase production project.
- [ ] Apply database migrations safely in deployment workflow.
- [ ] Add error monitoring, structured logs, backups, and basic rate limiting.
- [ ] Complete accessibility, privacy, security, and performance review.
- [ ] Add launch checklist and operational runbook.

**Done when:** the app can be deployed to `master` with monitoring and a repeatable release process.

## Execution order

We implement and verify one numbered task at a time. The next implementation task is **Task 3: Secure submission upload**.

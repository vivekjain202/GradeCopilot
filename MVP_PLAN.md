# GradeCopilot MVP Plan

## 1. Product goal

GradeCopilot helps a teacher turn student test submissions into accurate, personalized feedback and report cards. AI prepares an initial grading draft and contextual improvement comments; the teacher remains the final reviewer, editor, and publisher.

The MVP should prove one end-to-end workflow:

1. A teacher creates a test and its marking rubric.
2. The teacher uploads one student's test copy.
3. AI extracts the submission, evaluates answers against the rubric, and creates a grading draft.
4. The teacher reviews and edits scores and anchored sidebar comments in a document-style workspace.
5. AI creates a personalized report-card draft from the approved evaluation.
6. The teacher edits and publishes the final report.

## 2. Target users and roles

### Teacher (MVP user)

- Creates tests and rubrics.
- Uploads student test copies.
- Reviews and adjusts AI grading, scores, and comments.
- Generates, edits, and publishes report cards.

### Student/Parent (MVP recipient)

- Receives or views a published report card through a private link.
- Does not need an account in the first release.

## 3. MVP scope

### Include

- Teacher authentication.
- Student directory: name, class/section, roll number, guardian email (optional).
- Test setup: title, subject, date, total marks, and question-level rubric.
- PDF/image upload for a student test copy.
- AI processing pipeline:
  - OCR/transcription of uploaded work.
  - Question-by-question suggested marks and rationale.
  - Suggested improvement comments tied to excerpts/locations in the extracted answer document.
- Evaluation draft workspace:
  - Main document pane for the test transcription and grading annotations.
  - Right sidebar showing comment threads aligned to their selected text/answer block.
  - Teacher can accept, edit, resolve, delete, or add comments.
  - Teacher can change suggested marks and add an overall note.
- AI-generated report-card draft, including strengths, improvement areas, subject performance, and next steps.
- Teacher editing and publishing of report cards.
- Read-only report card sharing link; email delivery can be deferred.

### Exclude from the first MVP

- Live handwriting recognition correction tools.
- Batch grading many test copies at once.
- Multi-teacher schools, roles, or organization administration.
- Parent/student accounts and messaging.
- Gradebook integrations, exports, analytics dashboards, and payments.
- Automated final grading without teacher approval.

## 4. Suggested JavaScript stack

| Layer | Choice | Why |
| --- | --- | --- |
| Full-stack framework | Next.js (App Router) + TypeScript | React UI, server routes/actions, and a single deployable app. |
| UI | Tailwind CSS + shadcn/ui | Fast, accessible teacher-facing UI. |
| Database | PostgreSQL + Prisma | Relational data for tests, students, evaluations, and versions. |
| Authentication | Auth.js | Teacher login with familiar Next.js integration. |
| File storage | S3-compatible storage (e.g. Cloudflare R2) | Private, scalable storage for test copies. |
| Background jobs | Inngest or Trigger.dev | Reliable asynchronous OCR and AI processing. |
| Document editor | Tiptap (ProseMirror) | Rich-text content with stable anchors for sidebar comments. |
| AI | OpenAI API with structured JSON outputs | Rubric-based evaluation and report writing with predictable data. |
| OCR | OpenAI vision for MVP, with pluggable OCR provider later | Keeps the first workflow simple while supporting handwritten/photo submissions. |
| Deployment | Vercel + managed Postgres | Low operational overhead for the initial product. |

## 5. Core experience and screens

### A. Teacher dashboard

- Recent tests and evaluation progress.
- Quick actions: **Create test**, **Add student**, **Upload test copy**.

### B. Create test

- Test title, subject, class, date, total marks.
- Rubric builder with question number, expected answer/criteria, maximum marks, and optional feedback guidance.

### C. Student and submission setup

- Select or create a student.
- Upload PDF/JPG/PNG test copy.
- Show upload and processing state: queued, extracting, evaluating, ready, needs review, failed.

### D. Evaluation draft (primary MVP screen)

Google Docs-inspired, three-column layout:

| Area | Contents |
| --- | --- |
| Left rail | Student, test details, question score summary, processing status. |
| Main document | AI transcription organized by question; highlighted text/answer blocks with inline score markers. |
| Right sidebar | Anchored comment threads. Each comment is connected to a document selection or a question block, and selecting either side focuses the other. |

Required teacher actions:

- Edit transcription if OCR is wrong.
- Change earned marks per question.
- Edit, accept, resolve, remove, and create comments.
- Add overall feedback.
- Mark evaluation **finalized**.

### E. Report-card editor

- Generate report from finalized evaluation.
- Editable sections: performance summary, strengths, areas to improve, recommended next steps, teacher note.
- Preview published version and publish/unpublish controls.

### F. Shared report card

- Private tokenized URL.
- Clear student identity, test information, marks, final feedback, strengths, improvement areas, and next steps.

## 6. Data model (initial)

```text
User
  id, name, email, createdAt

Student
  id, teacherId, name, className, rollNumber, guardianEmail, createdAt

Test
  id, teacherId, title, subject, className, testDate, totalMarks, status

RubricQuestion
  id, testId, position, label, prompt, expectedAnswer, criteria, maxMarks

Submission
  id, testId, studentId, fileKey, mimeType, processingStatus, extractedDocumentJson

Evaluation
  id, submissionId, status, totalSuggestedMarks, totalFinalMarks,
  overallFeedback, finalizedAt

EvaluationQuestion
  id, evaluationId, rubricQuestionId, earnedMarksSuggested, earnedMarksFinal,
  rationale, answerContentJson

CommentThread
  id, evaluationId, questionId (nullable), anchorJson, status, createdBy, createdAt

Comment
  id, threadId, body, authorType (AI|TEACHER), createdAt

ReportCard
  id, evaluationId, status, shareToken, contentJson, publishedAt

AuditVersion
  id, entityType, entityId, snapshotJson, createdBy, createdAt
```

`anchorJson` stores a Tiptap/ProseMirror-compatible selection reference (question ID plus text block/offsets). When the teacher edits text, the editor maps anchors forward; if an exact quote can no longer be found, the comment remains tied to its question and is flagged for reattachment.

## 7. AI workflow and guardrails

1. Store the uploaded file privately and create a `Submission` with `queued` status.
2. A background job sends the file and rubric to the AI pipeline.
3. AI returns validated structured output: transcription, answer blocks, per-question suggested score, rationale, and candidate comments.
4. Persist the result as a draft only; never auto-finalize or publish it.
5. Teacher reviews the draft and finalizes marks/comments.
6. A second AI call generates a report-card draft using only finalized evaluation data.
7. Teacher reviews, edits, and explicitly publishes the report.

Guardrails:

- Prompts instruct AI to state uncertainty and avoid inventing unreadable answers.
- Validate score ranges against each rubric question and the test total.
- Label all AI-originated scores and comments until the teacher accepts or edits them.
- Keep an audit snapshot when an evaluation is finalized or a report is published.
- Use signed URLs/private storage; do not expose raw submissions via public links.

## 8. API / server capabilities

- `POST /api/tests` — create a test and rubric.
- `POST /api/students` — create a student.
- `POST /api/submissions/upload-url` — request secure upload URL.
- `POST /api/submissions/:id/process` — enqueue processing.
- `GET /api/evaluations/:id` — load evaluation workspace data.
- `PATCH /api/evaluations/:id` — save scores, document edits, and overall feedback.
- `POST /api/evaluations/:id/comments` — create/update anchored comment threads.
- `POST /api/evaluations/:id/finalize` — lock final evaluation snapshot.
- `POST /api/reports/generate` — generate report draft.
- `PATCH /api/reports/:id` — edit report content.
- `POST /api/reports/:id/publish` — publish and create/retain share token.
- `GET /report/:shareToken` — public, read-only report view.

In the Next.js implementation, these may be route handlers or server actions rather than a separate Node server. If we later need independent workers/services, the domain layer can move into a dedicated Node service without changing the frontend contract.

## 9. Build sequence

### Milestone 1 — Foundation

- Initialize Next.js, TypeScript, Tailwind, component library, Prisma/Postgres, and Auth.js.
- Implement teacher sign-in and protected dashboard shell.
- Add student and test/rubric CRUD.

### Milestone 2 — Upload and evaluation draft

- Add private file upload and submission records.
- Build a deterministic mock evaluator first so the review UI is usable before AI is connected.
- Build the Tiptap document view and anchored right-sidebar comments.
- Implement editable question scores and evaluation finalization.

### Milestone 3 — AI integration

- Add background job processing, structured AI evaluation, retries, and status UI.
- Replace/mock evaluator with AI-generated transcription, scores, rationales, and comments.
- Add score validation and uncertainty handling.

### Milestone 4 — Report cards and sharing

- Generate editable report-card drafts from finalized evaluations.
- Publish reports to secure tokenized links.
- Add version snapshots and basic activity/status history.

## 10. Definition of done for the MVP

A teacher can sign in, create a rubric-based test and student, upload a single test copy, receive an AI-created grading draft, review/edit anchored feedback and marks in a document-style UI, finalize the evaluation, generate and edit a personalized report, and publish a secure shareable report card.

## 11. Decisions to make before implementation

- Which first submission format to optimize for: typed PDFs, scanned handwriting, or mobile photos.
- Whether the first release needs email delivery, or a share link is sufficient.
- Whether a report card represents one test only (recommended MVP) or aggregates multiple tests.
- Preferred hosting accounts for Postgres, storage, and AI API credentials.

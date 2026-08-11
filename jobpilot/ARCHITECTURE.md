# JobPilot Architecture

Status: **Phases 1–4 of 7 complete** (scaffold/architecture/auth/schema →
résumé upload/parsing/structured editing → job-search profiles and
manual/CSV job ingestion with dedup → hard filters, deterministic match
scoring, and AI-generated match narrative). See [Roadmap](#roadmap) for
what's next. Full original product spec:
[`../aacargo-clone/jobsApply.md`](../aacargo-clone/jobsApply.md).

## Compliance rules (carried over verbatim from the spec)

These govern every phase, not just Phase 1. Nothing in later phases should
drift from them:

- Do not scrape LinkedIn or automate LinkedIn's website.
- Do not use browser automation to submit LinkedIn applications.
- Do not bypass CAPTCHAs, rate limits, authentication, or anti-bot protections.
- Only use official APIs, approved job feeds, public RSS feeds, job-alert
  emails authorized by the user, and job URLs manually supplied by the user.
- The system must never automatically submit an application without
  explicit human approval.
- For sources without an approved application API, open the official job
  page and let the user submit manually.
- Clearly identify the source and original URL of every job.
- Respect each source's terms of service, robots policies, API limits, and
  data-retention rules.
- Never fabricate résumé experience, education, certifications, skills,
  dates, metrics, or screening answers.
- AI may rewrite and reorganize verified information, but it must not
  invent qualifications.
- Do not make recommendations based on protected characteristics.
- Store secrets only in environment variables.

## System overview

Next.js 16 App Router app, server-rendered, with Prisma 7 over SQLite for
local dev (Postgres-shaped, swappable — see [Database](#database)).
Authentication is Auth.js v5 with the Credentials provider and JWT
sessions. Two integration points — AI provider and job source — are defined
as interfaces so Phase 4/5 (AI) and Phase 3 (ingestion) can add real
implementations without touching callers.

## Data model

All 17 models from the spec are implemented in
[`prisma/schema.prisma`](./prisma/schema.prisma):

`User`, `UserPreference`, `MasterResume`, `ResumeFact`, `ResumeVersion`,
`SearchProfile`, `Job`, `JobRequirement`, `JobMatch`, `TailoredResume`,
`CoverLetter`, `ReviewDecision`, `Application`, `ApplicationEvent`,
`JobSourceConnection`, `AIExecution`, `AuditEvent`.

**Why enum-like fields are `String`, not Prisma `enum`:** SQLite (our dev
datasource) doesn't support native `enum` or `String[]` in Prisma. Enum-like
columns (application status, résumé fact type, workplace type, etc.) are
plain `String`, validated in app code via the shared Zod enums in
[`src/lib/enums.ts`](./src/lib/enums.ts) — never trust the raw DB value
without parsing it through the matching schema. List-shaped fields (skills,
excluded companies, alternate titles, ...) are `Json`. Moving to Postgres
later can introduce native `enum`/`String[]` columns without changing any
call site, since the Zod contract stays identical.

**Application status lifecycle** (spec section G):
`DRAFT → ANALYZED → REVIEW_REQUIRED → APPROVED → READY_TO_APPLY →
SUBMISSION_CONFIRMED → APPLIED / REJECTED / INTERVIEW / OFFER / WITHDRAWN`.
The system must never transition `READY_TO_APPLY → APPLIED` without an
explicit user action (not implemented yet — Phase 6 — but the schema
already supports the guard: see next point).

**Duplicate-submission idempotency:** `Application` has
`@@unique([userId, jobId])`, and the intended status-transition pattern is
an optimistic-concurrency guard —
`db.application.updateMany({ where: { id, status: "READY_TO_APPLY" }, data: { status: "SUBMISSION_CONFIRMED", ... } })`
— if the returned count is `0`, the application was already submitted and
the caller no-ops instead of double-submitting. Implementation lands in
Phase 6.

**Row-level ownership:** `User`, `MasterResume`, `SearchProfile`, `JobMatch`,
`Application`, `JobSourceConnection`, `AIExecution`, and `AuditEvent` all
carry `userId`. Child records without their own `userId`
(`ResumeFact`, `JobRequirement`, `ReviewDecision`, `ApplicationEvent`) are
scoped transitively via their parent relation.

## Database

Dev datasource: SQLite via
[`@prisma/adapter-better-sqlite3`](https://www.npmjs.com/package/@prisma/adapter-better-sqlite3)
(Prisma 7 requires an explicit driver adapter — there's no implicit
connection from the schema's `datasource` block alone; see
[`src/lib/db.ts`](./src/lib/db.ts)). `DATABASE_URL` and migrations are
managed via [`prisma.config.ts`](./prisma.config.ts) (Prisma 7 moved
datasource URL config out of `schema.prisma`).

Moving to Postgres in production means: change `datasource.provider` in
`schema.prisma` to `"postgresql"`, swap the adapter in `src/lib/db.ts` to
`@prisma/adapter-pg`, and point `DATABASE_URL` at a real Postgres instance.
No application code outside those two files needs to change.

## Auth

Auth.js v5, Credentials provider only, JWT sessions (Credentials doesn't
support database sessions without an adapter, and an adapter isn't needed
here since there's no OAuth account linking to manage). See
[`src/server/auth/config.ts`](./src/server/auth/config.ts).

- `authorize()` looks up the user via
  [`src/server/data/users.ts`](./src/server/data/users.ts), compares the
  password with `bcryptjs`, and returns only `{ id, email, name }` — never
  the hash.
- Registration has no built-in Credentials flow, so it's a Server Action:
  [`src/server/actions/register.ts`](./src/server/actions/register.ts)
  (Zod validation → uniqueness check → `bcrypt.hash(password, 12)` →
  create → sign in → redirect).
- [`src/proxy.ts`](./src/proxy.ts) (Next.js 16 renamed Middleware to Proxy)
  does an **optimistic** check only — reads the JWT cookie, never hits the
  database — to redirect unauthenticated requests away from `/dashboard`
  and authenticated ones away from `/sign-in`/`/register`. It is explicitly
  not the real security boundary.
- The real boundary is
  [`src/server/auth/session.ts`](./src/server/auth/session.ts)
  (`requireUserId()`) plus the ownership-scoped data layer below — every
  server action, route handler, and page must call one of these before
  touching user data.

## Row-level ownership pattern

No server code calls `db.<model>` directly outside `src/server/data/*.ts`.
Each function there takes an explicit `userId`, sourced only from
`requireUserId()`/`getCurrentUserId()` (never from client-supplied input),
and bakes it into the `where` clause. See
[`src/server/data/resumes.ts`](./src/server/data/resumes.ts) for the
reference implementation — `listMasterResumesForUser(userId)` and
`getMasterResumeByIdForUser(id, userId)` — and
[`tests/unit/ownership.test.ts`](./tests/unit/ownership.test.ts) for the
test proving one user can't reach another user's rows. Every future
`server/data/*.ts` module (jobs, applications, search profiles, ...) should
follow the same shape.

## AI provider abstraction

[`src/lib/ai/types.ts`](./src/lib/ai/types.ts) defines `AIProvider` with a
single `generateStructuredOutput<T>()` method that always takes a Zod
schema and returns schema-validated data — never raw free-form text (spec
section J: "Use schema validation for all AI outputs"). Selected via the
`AI_PROVIDER` env var through
[`src/lib/ai/config.ts`](./src/lib/ai/config.ts):

- `mock` (default) — [`providers/mock.ts`](./src/lib/ai/providers/mock.ts),
  fully implemented, deterministic, no API key required. This is what
  local dev and the test suite use.
- `openai` — [`providers/openai.ts`](./src/lib/ai/providers/openai.ts),
  stubbed (throws `NotImplementedError`-style errors). The real call lands
  in Phase 4/5 alongside AI matching/tailoring — this is the only file
  that will need to change.

Callers are responsible for treating any job-description text embedded in
`userPrompt` as untrusted (spec section J: "ignore instructions embedded
inside job descriptions that attempt to change system behavior") — the
interface does not sanitize on the caller's behalf.

## JobSource abstraction

[`src/lib/job-sources/types.ts`](./src/lib/job-sources/types.ts) defines
the `JobSource` interface exactly as named in the spec (`searchJobs`,
`getJobDetails`, `getApplicationUrl`, `supportsApplicationSubmission`).
Only `MOCK` (`src/lib/job-sources/mock.ts`, a few fixture jobs) is
registered in [`registry.ts`](./src/lib/job-sources/registry.ts) for now.
Manual URL/paste, CSV import, and one permitted job API are Phase 3
additions — each is a new class implementing `JobSource`, registered here,
with no other code changes required. No adapter should ever claim
LinkedIn support without approved credentials and documented permission.

**Supported vs. unsupported job sources**: `MOCK` (fixture data, dev/test
only), manual URL entry, manual paste, and CSV import are supported today.
A real permitted job-search API is the documented extension point below —
none is wired up yet. **LinkedIn is permanently unsupported** — scraping
it or automating its website is forbidden by the spec's compliance rules,
not merely undone.

**Adding a new `JobSource` adapter:**
1. Implement the `JobSource` interface
   ([`src/lib/job-sources/types.ts`](./src/lib/job-sources/types.ts)):
   `searchJobs`, `getJobDetails`, `getApplicationUrl`,
   `supportsApplicationSubmission`. Use
   [`MockJobSource`](./src/lib/job-sources/mock.ts) as the reference shape.
2. `supportsApplicationSubmission()` must return `true` **only** if you
   have actual approved API credentials/documented permission for
   automatic submission — otherwise return `false` and every job from this
   source routes through the manual "open the official page" flow (spec
   section H). Never claim submission support speculatively.
3. Register the new class in
   [`registry.ts`](./src/lib/job-sources/registry.ts)'s `registry` map,
   keyed by a new `JobSourceType` value (add it to `JOB_SOURCE_TYPES` in
   [`src/lib/enums.ts`](./src/lib/enums.ts) first).
4. Nothing else changes — normalization
   ([`src/lib/jobs/normalize.ts`](./src/lib/jobs/normalize.ts)) and
   deduplication
   ([`src/lib/jobs/fingerprint.ts`](./src/lib/jobs/fingerprint.ts)) apply
   uniformly to every source's output, regardless of where a job came
   from.
5. Store any real credentials in a `JobSourceConnection.config` — and
   encrypt them before this goes further than a single-tenant dev
   deployment (see the Phase 7 section's encryption-at-rest deviation).

## Résumé upload, parsing & structured editing (Phase 2)

Implements the spec's Core User Flow steps 2-4 and Feature A. No AI is
involved — extraction is mechanical, structuring into facts is manual.

- **Upload validation** never trusts the client-declared MIME type.
  [`src/lib/resume/validate-upload.ts`](./src/lib/resume/validate-upload.ts)
  checks size, declared type, then reads the real bytes and sniffs the
  actual file signature via
  [`src/lib/resume/file-signature.ts`](./src/lib/resume/file-signature.ts):
  PDF must start with `%PDF-`; DOCX must have the ZIP signature **and** a
  `word/document.xml` entry in its central directory (closes the
  "rename a `.zip` to `.docx`" spoof cheaply via `jszip`). A mismatch
  between declared and sniffed type is rejected.
- **Extraction**: [`src/lib/resume/pdf.ts`](./src/lib/resume/pdf.ts) (via
  `unpdf`) and [`src/lib/resume/docx.ts`](./src/lib/resume/docx.ts) (via
  `mammoth`) produce plain text, run through
  [`sanitize.ts`](./src/lib/resume/sanitize.ts) (strips control
  characters, caps length) before ever being stored or displayed. A cheap
  regex heuristic in
  [`heuristics.ts`](./src/lib/resume/heuristics.ts) pre-populates an
  **unverified** CONTACT fact — never presented as confirmed.
- **Status lifecycle** (`RESUME_STATUSES` in `src/lib/enums.ts`):
  `UPLOADED → EXTRACTING → NEEDS_REVIEW → VERIFIED`. `VERIFIED` is only
  reachable via `createResumeVersionForUser`, and only once every fact has
  `verified: true`; any later edit reverts status to `NEEDS_REVIEW`.
- **Locked-fact guard** — the core invariant of this phase. Per-type Zod
  content schemas live in
  [`src/lib/resume/fact-schemas.ts`](./src/lib/resume/fact-schemas.ts).
  `replaceResumeFactsForUser` in `src/server/data/resumes.ts` is the single
  bulk-write path (reused unmodified by any future AI-assisted edit in
  Phase 4/5): a fact with `locked: true` is a **full no-op** if the payload
  tries to change it, and is **never implicitly deleted** by omission — it
  must be explicitly unlocked via `setResumeFactLockedForUser` first. See
  [`tests/unit/resume/replace-facts-locked-guard.test.ts`](./tests/unit/resume/replace-facts-locked-guard.test.ts).
- **Versioning**: `createResumeVersionForUser` snapshots the current fact
  set into `ResumeVersion` only on explicit save, only when every fact is
  verified (typed error otherwise, not a thrown 500) — see
  [`tests/unit/resume/create-version.test.ts`](./tests/unit/resume/create-version.test.ts).
- **UI**: `src/app/resume/page.tsx` (list + upload),
  `src/app/resume/[id]/page.tsx` (extracted-text correction, the
  accordion-grouped fact editor, save-version, version history), and
  `src/app/resume/[id]/file/route.ts` (original-file download with a
  safely-encoded `Content-Disposition` header).

## Job-search profiles & ingestion (Phase 3)

Implements spec Feature B (search profiles) and Feature C/D (manual URL/paste
entry, CSV import, normalization, dedup). No real job-search API yet
(deferred since Phase 1) — only manual, CSV, and the existing mock provider.

- **`Job` is a shared catalog with an *optional* owner.** Mock/future-API
  jobs have `createdByUserId: null` and are visible to everyone; manually
  entered or CSV-imported jobs are private to their creator (a pasted job
  description is often not meant to be public). Every read in
  [`src/server/data/jobs.ts`](./src/server/data/jobs.ts) applies
  `createdByUserId IS NULL OR createdByUserId = :userId` instead of a
  strict single-owner match — contrast with `SearchProfile`
  ([`src/server/data/search-profiles.ts`](./src/server/data/search-profiles.ts)),
  which is strict single-owner, matching `resumes.ts`'s pattern exactly.
- **Dedup is privacy-scoped.** `createManualJobForUser` checks for an
  existing job with the same `contentFingerprint` only among jobs already
  *visible* to the submitting user — a fingerprint match against another
  user's private job must never surface as "already exists," since that
  would leak the private job's existence. See
  [`tests/unit/jobs/manual-entry-dedup.test.ts`](./tests/unit/jobs/manual-entry-dedup.test.ts).
- **Normalization** ([`src/lib/jobs/normalize.ts`](./src/lib/jobs/normalize.ts))
  is the one place that decides what "clean" job data looks like — shared by
  manual-entry submission, every CSV row, and the seed script's mock-catalog
  upsert. It's deliberately lenient: an invalid/blank enum value or date
  becomes `undefined` rather than throwing, since one messy CSV cell must
  never fail an entire row.
  [`src/lib/jobs/fingerprint.ts`](./src/lib/jobs/fingerprint.ts) computes a
  stable SHA-256 over normalized company/title/description for dedup.
- **CSV import** ([`src/lib/jobs/csv.ts`](./src/lib/jobs/csv.ts), via
  `csv-parse/sync`) validates cheapest-first (file size → row count →
  per-row shape) and never lets one bad row abort the batch — failures are
  collected and returned in the import summary instead. The expected column
  schema is documented in
  [`src/lib/jobs/constants.ts`](./src/lib/jobs/constants.ts) and rendered
  as on-page docs at `/jobs/import`.
- **Manual/CSV entry never fetches or scrapes a URL** — the compliance rule
  from the spec ("only... job URLs manually supplied by the user") means
  the user always supplies the description text themselves; `sourceUrl` is
  recorded for attribution only.
- **`JobSource` stays separate.** Manual URL/paste and CSV import are
  deliberately *not* `JobSource` implementations (there's nothing to
  "search" — the user directly supplies the data) — see
  [`src/lib/job-sources/registry.ts`](./src/lib/job-sources/registry.ts)'s
  updated comment. `MockJobSource` remains the only registered source; a
  real permitted API would plug in there the same way, unrelated to
  `src/lib/jobs/`.

## Job matching & analysis (Phase 4)

Implements spec section E (filtering and ranking) and the AI-comparison half
of section J (schema validation, prompt-injection defense, labeling) — Core
Flow steps 8-9. No new Prisma models or migrations — `JobMatch` and
`AIExecution` already had every column this phase needed.

**Deliberate, documented deviation from a literal reading of the spec:**
section E says to apply deterministic filters "before AI scoring," which
literally suggests the AI computes the 0-100 score. We deviate:
[`src/lib/matching/score.ts`](./src/lib/matching/score.ts)'s
`computeMatchScore` is a pure, deterministic function (résumé `SKILL` facts
vs. `Job.requiredSkills`/`preferredSkills`, plus a role-title overlap
bonus) — the *only* thing that goes through the AI provider is the
qualitative narrative (`concerns`/`explanation`). Rationale: the only
`AIProvider` wired today is a zero-intelligence mock, so an "AI-computed"
score right now would be theater; a deterministic score is honestly
"transparent and explainable" (section E's own requirement) and — as a
direct, structural consequence — **cannot be altered by prompt injection**,
which is exactly what the spec's explicit testing requirement demands ("a
job description cannot override AI system instructions"). This is made
legible to the *user*, not just to code reviewers: the match panel's
attribution line explicitly separates "computed directly" (score,
matched/missing/transferable skills) from "AI-generated" (concerns,
explanation, labeled with the provider name). Revisit when a real provider
lands.

- **Hard filters** ([`src/lib/matching/filters.ts`](./src/lib/matching/filters.ts))
  compare a `Job` against a `SearchProfile` on all 7 spec-listed criteria
  (location, workplace type, salary, employment type, excluded companies,
  posting age, plus experience-level and sponsorship as low-confidence
  keyword-contradiction heuristics, since `Job` has no structured column
  for either). Every criterion is **fail-open**: missing/unstructured data
  on either side never counts as a failure, and failures never gate
  access — the job stays fully visible either way (spec: "Do not hide a
  job merely because the AI score is low. Let the user inspect rejected
  and filtered jobs."). Industry match and education/certification match
  from section E's factor list are **not scored** — no reliable structured
  field exists to compare (known limitation, not silently dropped).
- **Defense-in-depth schema validation**:
  [`src/lib/ai/generate.ts`](./src/lib/ai/generate.ts)'s
  `generateValidatedOutput` wraps every `AIProvider` call and
  *unconditionally* re-validates the returned data against the caller's
  Zod schema — it never assumes a provider validated its own output. This
  is what makes "AI output failing schema validation is rejected" true
  structurally, not just by convention; see
  [`tests/unit/ai/generate.test.ts`](./tests/unit/ai/generate.test.ts) for
  a deliberately misbehaving fake provider proving it.
- **Prompt-injection defense**:
  [`src/lib/matching/prompt.ts`](./src/lib/matching/prompt.ts) wraps
  `job.description` in explicit untrusted-content delimiters with a
  system-prompt instruction to never follow embedded instructions. Because
  the score/skill-lists never depend on the AI call at all (see deviation
  above), injection has zero structural effect on them regardless of
  prompt-engineering quality — proven directly in
  [`tests/unit/matching/prompt-injection.test.ts`](./tests/unit/matching/prompt-injection.test.ts).
- **Graceful degradation, never fabrication**: if the AI narrative call
  fails (network error, provider throws, or schema validation rejects its
  output), [`src/lib/matching/analyze.ts`](./src/lib/matching/analyze.ts)
  still persists a `JobMatch` using the deterministic half (100% real,
  non-fabricated) with an honest fallback explanation and a `FAILED`
  `AIExecution` linked for audit, rather than losing the whole analysis.
  `analyzeJobMatch` takes an injectable `AIProvider` parameter (defaulting
  to the configured one) specifically so this path is directly testable
  with a fake provider, not just inferred.
- **Caching**: the job-detail page always shows the most recent cached
  `JobMatch` (`getLatestJobMatchForUser`) rather than recomputing on every
  view; re-analysis is an explicit user action (spec: "Cache job analyses
  to control cost").
- Rate/spending limits are **explicitly deferred** — meaningless to build
  against a free mock provider; revisit when a real paid provider lands.

## Résumé tailoring, diff review & DOCX export (Phase 5)

Implements spec section F ("Résumé tailoring"), the relevant slice of
section G ("Human-review workflow" — diff review, accept/reject/edit, final
approval), and the Phase 5 delivery-plan line ("tailored résumé generation,
traceability, diff review, approval, and DOCX export") — Core Flow steps
10-14. No new Prisma models or migrations — `TailoredResume`, `CoverLetter`,
`ReviewDecision`, and `AuditEvent` already had every column this phase
needed; one additive JSON-shape change was required (below).

**Deliberate, documented deviations from a literal reading of the spec:**

- **`recommendedChanges[]` targets exactly one existing fact
  (`targetFactId`, required) and is a whole-field text replacement**,
  restricted to `section ∈ {SUMMARY, SKILL, WORK_HISTORY, PROJECT}` — never
  `CONTACT`, `EDUCATION`, `CERTIFICATION` (spec F: "Preserve employers,
  titles, dates, education, and certifications unless the user edits
  them"). The spec's suggested result schema is a free-form
  `originalText`/`proposedText` diff with no notion of "which fact." Without
  a discrete, checkable target, "locked facts cannot be changed by AI" and
  "unsupported claims are flagged" would be unprovable — wishes, not
  guarantees. A stable `targetFactId` per change is what makes both required
  tests honest, at the cost of not supporting bullet-level surgery or
  AI-driven skill reordering (a text diff can't express reordering; users
  can still reorder via the Phase 2 fact editor's `sortOrder` before
  generating).
- **`TailoredResume.content` is never AI-generated wholesale.** It is always
  deterministically assembled server-side
  ([`src/lib/tailoring/assemble.ts`](./src/lib/tailoring/assemble.ts)) from
  `(base ResumeVersion snapshot, enforcement-annotated changes, review
  decisions)` — the AI only ever proposes discrete, checkable rewrites; the
  document itself is always reconstructed from verified facts + explicit
  user decisions. Stronger than the spec's literal `tailoredResume: {}`
  AI-output field, in service of "AI may rewrite... but must not invent
  qualifications."
- **Enforcement runs exactly once, server-side, immediately after the AI
  call returns, before anything is persisted**
  ([`src/lib/tailoring/enforce.ts`](./src/lib/tailoring/enforce.ts)) — never
  trusted from the AI. Every `recommendedChanges` entry gets a `status`:
  `"OK"`, or one of `DROPPED_UNSUPPORTED_TARGET` /
  `DROPPED_UNSUPPORTED_SUPPORT` / `DROPPED_LOCKED_FACT`. Dropped entries are
  **persisted, never deleted** (surfaced in the review UI as
  "unsupported/uncertain statements" per spec G), but `assemble.ts` refuses
  to apply a `status !== "OK"` change regardless of any `ReviewDecision`
  that might exist for it — belt-and-suspenders, proven directly in
  [`tests/unit/tailoring/enforce.test.ts`](./tests/unit/tailoring/enforce.test.ts)
  and
  [`tests/unit/tailoring/assemble.test.ts`](./tests/unit/tailoring/assemble.test.ts)
  (a forged `ACCEPTED` decision for a dropped change is still never
  applied).
- **No deterministic fallback on AI failure**, unlike Phase 4's match
  analysis. Tailoring has no non-AI-derived content to fall back to;
  persisting an empty/fabricated `TailoredResume` shell would be worse than
  a clear, retryable error. On failure:
  [`src/lib/tailoring/tailor.ts`](./src/lib/tailoring/tailor.ts) records a
  `FAILED` `AIExecution` and creates no `TailoredResume` row.
- **New status enum, scoped to the artifact, not the application
  lifecycle**: `TAILORED_ARTIFACT_STATUSES = ["DRAFT", "APPROVED"]`
  ([`src/lib/enums.ts`](./src/lib/enums.ts)), used by both
  `TailoredResume.status` and `CoverLetter.status`. `APPLICATION_STATUSES`
  stays untouched — that's Phase 6's `Application` lifecycle.
- **Cover letters have no per-sentence review model.**
  `ReviewDecision.tailoredResumeId` only FKs to `TailoredResume` — building
  a parallel decision model for cover letters would itself be a schema
  change, out of scope. Cover letters are edited as free text and approved
  coarsely, alongside the résumé, on the same final checkbox. Traceability
  for a cover letter is a one-time, non-persisted warning
  (`hasUnsupportedReferences`, checked against known fact ids right after
  generation), not a hard block.
- **The required confirmation sentence is enforced server-side.**
  [`src/lib/tailoring/approve.ts`](./src/lib/tailoring/approve.ts) rejects
  approval unless the caller supplies
  `"I reviewed this application and confirm that all information is
  accurate."` exactly
  ([`src/lib/tailoring/constants.ts`](./src/lib/tailoring/constants.ts)) — a
  bypassed/broken client cannot approve without literally sending that
  sentence.
- **Screening-question answers and "open official application page" /
  submission flow are out of scope for this phase** — no screening-question
  source exists yet, and application tracking is Phase 6. The review page
  intentionally omits those two spec-G bullets rather than stubbing them.
- **PDF export is not attempted** — spec's own "DOCX first, with PDF export
  when supported" phrasing defers it; `pdf-lib` stays a fixture-only
  devDependency. `docx` moved from `devDependencies` to `dependencies` this
  phase since DOCX generation now happens at request time, not just in the
  fixture-generation script.
- **`ResumeVersion.snapshot.facts[]` gained a stable `id` field**
  (previously omitted) — pure additive JSON-shape change
  (`src/server/data/resumes.ts`'s `createResumeVersionForUser`), required so
  a `recommendedChanges` entry can name one specific fact for the
  locked/unsupported checks.
- **An `AuditEvent` row is written on approval**
  (`action: "APPLICATION_MATERIALS_APPROVED"`,
  [`src/server/data/approvals.ts`](./src/server/data/approvals.ts)) — this
  table existed since Phase 1 but was unused until now; fulfills spec
  SECURITY's "add an audit trail for approval and submission actions."

Other notable pieces:

- **`changePath` is an append-only audit contract.**
  `recordReviewDecisionForUser` never updates a `ReviewDecision` row, only
  inserts — "most recent row per `changePath` wins" is the intended read
  pattern (`getLatestDecisionsByChangePath`), the same non-obvious-contract
  treatment as the Phase 2 locked-fact no-op rule.
- **Tailoring is generated against a frozen `ResumeVersion`, not live
  `ResumeFact` rows** — `TailoredResume.baseVersionId` pins a review to an
  immutable snapshot, so a concurrent résumé edit mid-review can never move
  the ground truth out from under it.
- **Approval requires every non-dropped change to have a decision** —
  enforced server-side in `approve.ts`, not just as a disabled button
  client-side.
- **DOCX export routes only serve `APPROVED` artifacts** — mirrors the
  Phase 2 authenticated-file-download pattern
  (`src/app/resume/[id]/file/route.ts`), extended with a status check so
  unreviewed AI content can never leave the system.

## Application assistance & tracker (Phase 6)

Implements spec section H ("Application assistance," the manual-submission
half only) and section I ("Application tracker") — Core Flow steps 15-17.
No new Prisma models or migrations — `Application` and `ApplicationEvent`
have existed, fully defined, since Phase 1; `APPLICATION_STATUSES` was
defined but completely unused until this phase.

**Deliberate, documented deviations from a literal reading of the spec:**

- **The human-approval gate runs exactly once, at `Application` row
  creation, never re-checked on read.**
  [`getOrCreateApplicationForUser`](./src/server/data/applications.ts)
  refuses to create a row unless the job's latest `JobMatch`'s latest
  `TailoredResume` has `status === "APPROVED"` (a `CoverLetter` is never
  required — spec's own "optional cover letter" language). Because every
  other function in this phase only operates on an already-existing row,
  "no application can be submitted before human approval" is a structural
  invariant provable on one function, not re-derived from UI state on every
  read. Re-checking on every read would also be a real footgun:
  re-running match analysis after approval starts a fresh `JobMatch` with
  its own unapproved `TailoredResume`, and re-checking would incorrectly
  lock a user out of an application they already legitimately started.
- **`Application.status` starts at `READY_TO_APPLY`**, skipping
  `DRAFT`/`ANALYZED`/`REVIEW_REQUIRED`/`APPROVED` — those states already
  have a home on `JobMatch`'s existence and `TailoredResume.status`
  (Phases 4-5); duplicating that sub-pipeline here would be redundant,
  untestable busywork, since an `Application` row is only ever created once
  the upstream pipeline has independently reached `APPROVED`.
- **`READY_TO_APPLY -> APPLIED` is one idempotent, conditional-update
  function** — `confirmApplicationSubmissionForUser` uses the exact
  `updateMany({ where: { id, userId, status: "READY_TO_APPLY" } })` pattern
  already established by `setResumeStatusForUser`
  (`src/server/data/resumes.ts`). A second call (double-click, or a race)
  matches zero rows and returns a non-destructive `ALREADY_SUBMITTED`
  result instead of erroring or writing a second `ApplicationEvent` — the
  direct, tested implementation of the spec's one explicit hard rule: "The
  system must not transition from READY_TO_APPLY to APPLIED without a user
  action." Proven in
  [`tests/unit/applications/confirm-submission.test.ts`](./tests/unit/applications/confirm-submission.test.ts).
- **Post-`APPLIED` outcome changes go through a narrower, separate
  function** (`recordApplicationOutcomeForUser`) whose input type
  structurally excludes `APPLIED`/`READY_TO_APPLY`/`SUBMISSION_CONFIRMED`
  (a dedicated `TrackedOutcomeStatus` enum — only
  `REJECTED`/`INTERVIEW`/`OFFER`/`WITHDRAWN`), rejects if the row isn't
  already at `APPLIED`-or-later (`NOT_YET_APPLIED` — you can't skip the
  confirmed-submission step by jumping straight to `OFFER`), and
  optimistically re-checks the current status before writing so a
  concurrent edit is detected rather than silently overwritten.
- **`SUBMISSION_CONFIRMED` stays defined but unused.** It's reserved for
  spec H's *second half* — a future approved-API adapter's "log the
  response" step. No `JobSource` in this codebase sets
  `supportsApplicationSubmission()` true today (`MockJobSource` returns
  `false` explicitly), so there is no automatic-submission code path for
  anything to retry — proven directly by
  [`tests/unit/applications/no-automatic-submission.test.ts`](./tests/unit/applications/no-automatic-submission.test.ts),
  not just left unimplemented. Building the payload-preview/
  confirm-and-submit/log-response/no-auto-retry machinery now would be
  unreachable, untestable-for-real dead code; deferred until a real
  approved API is integrated, at which point it needs its own dedicated
  test suite.
- **Kanban has no drag-and-drop.** A per-card status `Select`
  ([`application-status-select.tsx`](./src/app/applications/application-status-select.tsx))
  produces the identical status-changing outcome spec I needs, without
  pulling in a DnD library disproportionate to this MVP. `READY_TO_APPLY`
  cards never render this control at all — that transition only happens
  via the dedicated confirm-submission page.
- **Follow-up "reminders" are a visual badge only**, computed at render
  time (`followUpDate <= today`) — no notification/email system, which
  would need background-job infrastructure the spec defers.
- **Screening-question answers stay a deferred/unavailable notice** — no
  screening-question source exists anywhere in the app (first noted in
  Phase 5 for cover letters; now an accumulated, explicitly-documented
  limitation across two phases, not a new gap).
- **URL is `/applications/[jobId]`, not `/applications/[applicationId]`.**
  `Application` is keyed by `(userId, jobId)` with no independent natural
  key the job-detail page can reference before the row exists; `jobId`
  lets the job-detail page link directly and lets the destination page
  perform (or explain) the gated get-or-create itself.
- **Table/Kanban toggle is a `?view=` search param**, not a client `Tabs`
  component — consistent with this codebase's existing preference for
  server-rendered simplicity (mirrors the `?duplicate=1` param from
  Phase 3).
- **Duplicate-application prevention** relies on the DB's existing
  `@@unique([userId, jobId])` constraint plus `db.application.upsert`
  inside `getOrCreateApplicationForUser` — proven in
  [`tests/unit/applications/duplicate-prevention.test.ts`](./tests/unit/applications/duplicate-prevention.test.ts).

## Security, privacy & Docker (Phase 7)

Implements spec SECURITY (rate limiting, account export/deletion),
TESTING REQUIREMENTS' "secrets are not exposed in client bundles or logs,"
and DEVELOPER EXPERIENCE's Docker Compose/API-documentation bullets — a
hardening/packaging phase, not new product features. No Prisma migrations.

**Deliberate, documented deviations from a literal reading of the spec:**

- **Docker Compose containerizes the existing SQLite-backed app — no
  Postgres migration.** Every phase since Phase 1 has documented SQLite as
  an accepted deviation with a described-but-not-executed Postgres swap
  path (see [Database](#database)). Migrating now would touch the driver
  adapter and regenerate every migration as Postgres SQL, risking all 188
  existing tests' SQLite-file-per-test setup, for a phase whose goal is
  hardening an already-complete app. The SQLite file lives in a named
  Docker volume (`docker-compose.yml`) so it survives rebuilds.
- **Rate limiting is in-memory, single-process, `Map`-based**
  ([`src/lib/rate-limit.ts`](./src/lib/rate-limit.ts)) — no Redis. Applied
  to `signInWithCredentials`/`registerUser` (keyed by submitted email —
  brute-force protection) and the three AI-triggering actions
  (`analyzeJobMatchAction`, `generateTailoredResumeAction`,
  `generateCoverLetterAction`, keyed per-action-per-`userId`). This is the
  fulfillment of section J's "add rate limits," previously and correctly
  deferred in Phase 4 as "meaningless against a free mock provider" — a
  request-count limiter protects against abuse/cost regardless of
  provider, so it's implemented now, not re-deferred. Known limitation:
  doesn't coordinate across multiple instances/processes — acceptable for
  this MVP's single-instance story.
- **CSRF/secure cookies: framework defaults, verified in source, not
  reimplemented.** Next.js Server Actions enforce same-origin/Origin
  checks by default since Next 14; Auth.js v5's JWT cookie defaults to
  `httpOnly` + `sameSite=lax` + `secure` in production, and
  [`src/server/auth/config.ts`](./src/server/auth/config.ts) overrides
  none of it (no `cookies:` key present). Verified by reading the source,
  not re-tested against a live cross-origin request in this environment —
  an honest boundary, not a false claim of exhaustive testing.
- **Encryption-at-rest stays explicitly deferred on both spec-named
  fronts**, documented rather than built as theater: (a)
  `JobSourceConnection.config` — no code path anywhere writes a real value
  into it (only `MOCK` is registered), so encrypting a column nothing
  populates would be unverifiable; (b) full at-rest encryption of résumé
  content is out of scope for a hardening phase — it would touch every
  read path across Phases 2-6 for limited real protection without an
  accompanying KMS story on a single-tenant SQLite deployment.
- **Account deletion requires password re-entry**
  ([`delete-account-form.tsx`](./src/app/settings/privacy/delete-account-form.tsx)),
  not a typed confirmation sentence like Phase 5's
  `REQUIRED_CONFIRMATION_TEXT` pattern. Deletion's primary threat is a
  hijacked session (XSS, an unlocked shared machine) triggering an
  irreversible action without the real owner's intent — a typed phrase
  doesn't defend against that (any script that submits a form can type a
  fixed string); re-entering the password proves the live credential is
  present, the standard pattern for destructive account actions.
- **A real, confirmed privacy bug is fixed as part of account deletion**:
  `Job.createdByUserId` uses `onDelete: SetNull` (correct in general — a
  shared `JobMatch`/`Application` referencing the job shouldn't vanish).
  But per [`src/server/data/jobs.ts`](./src/server/data/jobs.ts)'s
  visibility rule (`createdByUserId IS NULL OR createdByUserId = userId`),
  a naive `db.user.delete()` would null out a deleted user's *private*
  pasted job descriptions, silently promoting them to shared/visible-to-
  everyone.
  [`deleteAccountForUser`](./src/server/data/account.ts) hard-deletes the
  user's private `Job` rows *before* the cascading user delete, inside the
  same transaction — proven in
  [`tests/unit/account/delete-privacy-leak.test.ts`](./tests/unit/account/delete-privacy-leak.test.ts).
  Every other `User` relation is already `onDelete: Cascade` except
  `AuditEvent.userId` (`SetNull`, correct — the audit trail must survive
  the account it describes).
- **Secrets-in-client-bundle verification is a standalone script**
  ([`scripts/verify-secrets.ts`](./scripts/verify-secrets.ts),
  `npm run verify:secrets`), not a Vitest test — it depends on a completed
  production build (~1-2 min), which doesn't fit `vitest run`'s
  fast-feedback model. It injects a distinctive dummy secret as
  `OPENAI_API_KEY`, runs a real `next build`, and greps `.next/static`
  (browser-shipped code only — never `.next/server`, which legitimately
  contains env values) for it. Run it whenever a new client component
  might plausibly import something server-only.
- **Documentation expands this file, not new fragmented doc files** —
  every prior phase centralized scope/deviations/extension points here;
  README stays thin.

Other notable pieces:

- **Rate limiting never silently swallows** — every rate-limited action
  returns a typed `{ ok: false, error: "RATE_LIMITED", retryAfterSeconds }`
  (AI actions) or a form message (`signInWithCredentials`/`registerUser`),
  never a generic failure.
- **Account export** (`GET /settings/privacy/export`) mirrors the
  Phase 5 authenticated-download pattern
  ([`src/app/resume/[id]/file/route.ts`](./src/app/resume/[id]/file/route.ts))
  and includes everything the user owns *except* `passwordHash` and
  `JobSourceConnection.config` (redacted entirely — a downloaded JSON file
  is a bigger exfiltration surface than a live DB row, deliberately
  stricter than the spec requires).
- **Docker gotcha, flagged honestly, not hidden**: whether the
  `better-sqlite3` driver adapter accepts an absolute `file:/data/...` URL
  the same way it accepts the existing relative `file:./dev.db` has not
  been verified — **no Docker CLI is available in this development
  environment**, so `docker compose build`/`up` have not been exercised.
  The `Dockerfile`/`docker-compose.yml` are written to established best
  practice (multi-stage build, `output: "standalone"`, non-root user, a
  named volume for the SQLite file, `npm ci` run fresh inside the
  container rather than copying host `node_modules`), but their first real
  run needs a human/CI environment with Docker installed. Observed and
  benign: `next build` now prints "`next start` does not work with
  `output: standalone`... use `node .next/standalone/server.js` instead" —
  `npm run start` and the e2e suite's `webServer` (which uses it) still
  work fine locally (Next still emits the regular, non-standalone server
  output alongside the standalone one), this only matters for the Docker
  image's `CMD`, which already correctly runs `node server.js`.

## API reference (Server Actions & Route Handlers)

Everything in this app is either a Next.js Server Action (mutations,
called from forms/client components) or a small number of authenticated
Route Handlers (file/document downloads). There is no separate REST/GraphQL
API layer. Every entry below requires a valid session
(`requireUserId()`/`getCurrentUserId()`) unless noted otherwise.

| Area | Export | Signature | Notes |
| --- | --- | --- | --- |
| Auth | `registerUser` (`src/server/actions/register.ts`) | `(prevState, FormData) => RegisterFormState` | No session required. Rate-limited by email. |
| Auth | `signInWithCredentials` (`src/server/actions/sign-in.ts`) | `(prevState, FormData) => SignInFormState` | No session required. Rate-limited by email. |
| Auth | `signOutAction` (`src/server/actions/sign-out.ts`) | `() => void` | |
| Résumé | `uploadResumeAction`, `updateExtractedTextAction`, `replaceResumeFactsAction`, `setResumeFactLockedAction`, `createResumeVersionAction` | see `src/server/actions/resume-*.ts` | Ownership-scoped via `requireUserId()`. |
| Résumé | `GET /resume/[id]/file` | route handler | Downloads the original uploaded file. 404s if not owned. |
| Search profiles | `createSearchProfileAction`, `updateSearchProfileAction`, `deleteSearchProfileAction` (`src/server/actions/search-profiles.ts`) | `(...) => {ok, ...}` | |
| Jobs | `createManualJobAction`, `importJobsCsvAction` (`src/server/actions/jobs.ts`) | `(...) => {ok, ...}` | |
| Matching | `analyzeJobMatchAction` (`src/server/actions/matches.ts`) | `(jobId, searchProfileId) => AnalyzeJobMatchActionResult` | Rate-limited per user. |
| Tailoring | `generateTailoredResumeAction`, `generateCoverLetterAction`, `recordReviewDecisionAction`, `updateCoverLetterAction`, `approveApplicationMaterialsAction` (`src/server/actions/tailoring.ts`) | see file | Generation actions are rate-limited per user. |
| Tailoring | `GET /review/[jobMatchId]/export/resume`, `GET /review/[jobMatchId]/export/cover-letter` | route handlers | Only serve `APPROVED` artifacts; 404 otherwise. |
| Applications | `startApplicationAction`, `confirmApplicationSubmissionAction`, `recordApplicationOutcomeAction`, `updateApplicationDetailsAction` (`src/server/actions/applications.ts`) | see file | `startApplicationAction` is gated on an approved tailored résumé. |
| Account | `deleteAccountAction` (`src/server/actions/account.ts`) | `(prevState, FormData) => DeleteAccountFormState` | Requires password re-entry. Irreversible. |
| Account | `GET /settings/privacy/export` | route handler | Downloads a JSON export of everything the user owns. |

## Folder structure

```
jobpilot/
  prisma/schema.prisma, migrations/
  prisma.config.ts
  src/
    app/
      page.tsx                          # landing page
      (auth)/sign-in/, (auth)/register/ # public
      dashboard/                        # protected home
      resume/                           # Phase 2: list + upload
        [id]/                           # detail: text panel, fact editor, versions
          file/route.ts                 # original-file download
      jobs/                             # Phase 3: list + manual entry + CSV import
        new/, import/, [id]/            # [id]/ also hosts the Phase 4 match panel
                                         # and the Phase 5 tailoring-panel entry point
      search-profiles/                  # Phase 3: list + create/edit
        [id]/
      review/[jobMatchId]/              # Phase 5: diff review, approval, DOCX export
        page.tsx, review-panel.tsx
        export/resume/route.ts, export/cover-letter/route.ts
      applications/                     # Phase 6: tracker + per-job confirmation page
        page.tsx, application-status-select.tsx
        [jobId]/
          page.tsx, start-application-button.tsx,
          confirm-submission-form.tsx, application-details-form.tsx
      settings/                         # Phase 7: settings/integrations + privacy
        page.tsx
        privacy/
          page.tsx, delete-account-form.tsx, export/route.ts
      api/auth/[...nextauth]/route.ts
    components/ui/                      # shadcn
    server/
      auth/    (config.ts, session.ts, types.d.ts)
      data/    (users.ts, resumes.ts, jobs.ts, search-profiles.ts,
                matches.ts, ai-executions.ts, tailored-resumes.ts,
                cover-letters.ts, approvals.ts, applications.ts, account.ts, ...)  ← ownership-scoped queries
      actions/ (register.ts, sign-in.ts, sign-out.ts,
                resume-upload.ts, resume-text.ts, resume-facts.ts, resume-version.ts,
                jobs.ts, search-profiles.ts, matches.ts, tailoring.ts, applications.ts,
                account.ts)
    lib/
      ai/          (types.ts, config.ts, generate.ts, providers/{mock,openai}.ts)
      job-sources/ (types.ts, mock.ts, registry.ts)
      resume/      (constants, file-signature, validate-upload, pdf, docx,
                    sanitize, heuristics, fact-schemas, fact-field-config,
                    version-snapshot)
      jobs/        (constants, fingerprint, normalize, csv, schemas)
      matching/    (json-utils, filters, score, schemas, prompt, analyze)
      tailoring/   (schemas, prompt, cover-letter-prompt, enforce, assemble,
                    field-mapping, tailor, cover-letter, approve, constants)
      documents/   (resume-docx-export, cover-letter-docx-export)
      applications/ (schemas.ts)
      rate-limit.ts                     # Phase 7
      enums.ts, db.ts, env.ts, utils.ts
    proxy.ts
  scripts/generate-resume-fixtures.ts   # devDependency-only fixture generator
  scripts/verify-secrets.ts             # Phase 7 — see "Security, privacy & Docker" above
  Dockerfile, docker-compose.yml, .dockerignore   # Phase 7
  tests/{unit/, e2e/, fixtures/, helpers/}
```

## Testing strategy

- `tests/unit/utils.test.ts` — trivial pure-function test
  (`clampMatchScore`), proving `npm run test` is meaningful.
- `tests/unit/ownership.test.ts` — seeds two users + résumés against a
  dedicated test SQLite DB, proves `listMasterResumesForUser` /
  `getMasterResumeByIdForUser` cannot cross users. This directly satisfies
  the spec's "one user cannot access another user's résumé" requirement.
- `tests/unit/resume/*` — file-signature spoof/size/MIME rejection, PDF/DOCX
  extraction against generated fixtures, per-type content schema
  validation, the locked-fact guard contract, and the
  unverified-blocks-version-creation invariant. Each integration-style test
  (locked-guard, create-version, ownership) gets its **own** dedicated
  SQLite file (`tests/helpers/test-db.ts`) so parallel test-file workers
  never race on a shared database file.
- `tests/unit/jobs/*` — fingerprint stability/collision, lenient
  normalization (bad enum/date values dropped, not thrown), CSV parsing
  (valid rows, a missing-required-column row, a malformed file, the
  row-count limit), the full `SearchProfileInputSchema`, the privacy-scoped
  dedup contract, and job visibility (private jobs invisible to other
  users, shared/`null`-owner jobs visible to everyone).
- `tests/unit/search-profiles/ownership.test.ts` — mirrors
  `tests/unit/ownership.test.ts`: strict single-owner CRUD, a non-owner
  can't read/update/delete another user's search profile.
- `tests/unit/ai/generate.test.ts` — `generateValidatedOutput` rejects a
  fake provider's schema-violating output rather than trusting it blindly.
- `tests/unit/matching/*` — every hard-filter criterion pass/fail/fail-open,
  the deterministic scorer's overlap/role-title/empty-list-ratio-1 cases,
  the prompt-injection-has-zero-effect proof, and an integration-style
  `analyze-orchestrator.test.ts` (dedicated test DB) proving a full run
  creates a correctly cross-linked `AIExecution`+`JobMatch`, that
  `inputSummary` never leaks raw job/résumé content, and that the
  schema-rejection degradation path persists the deterministic half
  instead of losing the analysis. `tests/unit/matching/ownership.test.ts`
  mirrors the established ownership-test pattern for `JobMatch`.
- `tests/unit/tailoring/*` — `enforce.test.ts` (the two named spec tests:
  locked facts never reach `"OK"`, unsupported target/support ids are
  flagged not inserted), `assemble.test.ts` (accept/reject/edit behavior,
  and the belt-and-suspenders proof that a dropped change is never applied
  even given a forged decision), `prompt-injection.test.ts` (a fabricated/
  injected `targetFactId` or `supportingFactIds` entry is neutralized by
  `enforceRecommendedChanges`, proven independent of the orchestrator),
  `schemas.test.ts`, `docx-export.test.ts` (output buffers round-trip
  through the existing DOCX signature sniffer), `tailor-orchestrator.test.ts`
  (dedicated test DB — real mock provider produces a `SUCCEEDED`
  `AIExecution`+`TailoredResume`; a fake provider proposing a locked/
  nonexistent-fact change persists it as dropped, never appliable;
  schema-invalid output creates no row and records a `FAILED`
  `AIExecution`; `inputSummary` redaction), `ownership.test.ts`
  (`TailoredResume`/`CoverLetter`/`ReviewDecision` cross-user isolation,
  mirroring the established pattern), `review-decisions.test.ts`
  (append-only writes, "latest wins," rejects deciding a non-`OK` change),
  and `approve-guard.test.ts` (rejects on pending decisions, wrong
  confirmation text, and re-approval of an already-`APPROVED` row; success
  flips both statuses atomically and writes an `AuditEvent`).
- `tests/unit/applications/*` — `gate.test.ts` (the named requirement "no
  application can be submitted before human approval": rejects while the
  tailored résumé is `DRAFT`, succeeds once `APPROVED` with no cover letter
  at all, and the transition guard independently rejects a row manually
  seeded outside `READY_TO_APPLY`), `duplicate-prevention.test.ts` (two
  `getOrCreateApplicationForUser` calls return the same row, count stays
  1), `confirm-submission.test.ts` (the named "double-clicking cannot
  create duplicate submissions" test: two sequential calls produce exactly
  one `APPLIED` `ApplicationEvent`, `dateApplied` unchanged by the second
  call), `outcome-transitions.test.ts` (`APPLIED -> INTERVIEW -> OFFER`
  writes one event per hop; the schema structurally rejects
  `APPLIED`/`READY_TO_APPLY`/`SUBMISSION_CONFIRMED` as a `toStatus`; the
  data layer rejects being called against a `READY_TO_APPLY` row),
  `no-automatic-submission.test.ts` (the named "unknown submission results
  are not automatically retried" structural proof — every registered
  `JobSource` has `supportsApplicationSubmission() === false`),
  `ownership.test.ts` (mirrors the established pattern), and
  `details-and-tracker.test.ts` (annotation updates never touch status or
  write an event).
- `tests/e2e/home.spec.ts`, `tests/e2e/resume-upload.spec.ts`,
  `tests/e2e/manual-job-entry.spec.ts`, `tests/e2e/job-match-analysis.spec.ts`,
  `tests/e2e/tailoring-review.spec.ts`, and
  `tests/e2e/application-tracker.spec.ts` — Playwright: landing page smoke
  test, a full register → upload → extracted-text-renders round trip, a
  full register → add-a-job → appears-on-/jobs round trip, a register →
  add-a-job → "verify a résumé first" prompt round trip, a register →
  add-a-job → tailoring panel's "run a match analysis first" prompt +
  `/review/[jobMatchId]` 404-on-nonexistent-id round trip, and a register →
  add-a-job → application panel's eligibility explainer +
  `/applications/[jobId]`'s "not ready yet" state + `/applications`'s
  empty-tracker state round trip (a full résumé-to-VERIFIED-to-tailored-to-
  applied e2e round trip was judged too expensive for coverage the
  unit/integration tests already provide structurally — no test-only
  shortcut exists to seed a VERIFIED résumé outside the real UI).
- `tests/unit/rate-limit.test.ts` — the rate-limit utility itself:
  allows-under-limit, blocks-at-limit, resets-after-window (via an injected
  clock, no real sleeps), per-key isolation.
  `tests/unit/auth/rate-limit-signin.test.ts` — the real
  `signInWithCredentials` action, called past the attempt limit with a
  wrong password, blocks even a subsequent *correct* password (proves the
  check runs before `signIn()`, not after failure); a different email in
  the same window is unaffected. `next-auth`'s config/`AuthError` are
  mocked at the module boundary (`vi.mock`) — importing the real
  `next-auth` package reaches internals that require `next/server`,
  unavailable outside Next's own runtime; this was confirmed empirically,
  not assumed.
- `tests/unit/account/*` — `export.test.ts` (a user's export contains
  exactly their own rows, never another user's, never `passwordHash`,
  never `jobSourceConnection.config`), `delete-privacy-leak.test.ts` (the
  confirmed-and-fixed bug: a deleted user's private job is hard-deleted,
  not silently promoted to shared via a nulled `createdByUserId`),
  `delete-cascade.test.ts` (every child row is gone after deletion, a
  shared job the user merely matched against survives, the
  `"ACCOUNT_DELETED"` `AuditEvent` persists with `userId: null`).
- Schema-changing test setup deliberately applies `prisma/migrations/*/migration.sql`
  directly via `better-sqlite3` rather than invoking the `prisma` CLI —
  Prisma's CLI refuses schema-changing commands when it detects an AI
  coding agent invoking them without fresh explicit human consent, which is
  correct behavior to respect, not route around.
- `npm run verify:secrets` — a standalone script, not part of `vitest run`
  (see the Phase 7 section above for why); run manually/in CI whenever a
  new client component might plausibly import something server-only.

This completes all seven phases. Remaining gaps (a real approved-API
submission adapter's own test suite, Postgres, etc.) are permanent,
explicitly-documented known limitations below, not deferred to a future
phase that doesn't exist.

## Known limitations

- No real job-search API — only manual entry, CSV import, and the mock
  provider (a real permitted API is deferred to a future phase).
- No real AI calls — `AI_PROVIDER=mock` only; the OpenAI provider throws
  (deferred). Résumé fact extraction, job normalization, and match *scoring*
  are all mechanical/deterministic, not AI-assisted, by design (see "Job
  matching & analysis" above for the scoring deviation specifically) — the
  match narrative, résumé-tailoring rewrites, and cover letters go through
  the AI provider, but even that is a static, honest stub under mock, and
  the tailored résumé *document* itself is always deterministically
  assembled server-side (see "Résumé tailoring" above), never AI-generated
  wholesale.
- Industry match and education/certification match (spec section E's
  scoring factor list) are not evaluated — no reliable structured field to
  compare against on either the résumé or job side yet.
- Experience-level and sponsorship hard filters are low-confidence keyword
  heuristics against free text, not structured comparisons — `Job` has no
  dedicated columns for either. Self-labeled as such in the UI.
- Rate/spending limits on AI calls are not implemented — deferred until a
  real, paid provider is wired; meaningless against a free mock.
- Résumé tailoring only supports whole-field text replacement for
  `SUMMARY`/`SKILL`/`WORK_HISTORY`/`PROJECT` facts — no bullet-level
  surgery, and no AI-driven skill *reordering* (a text diff can't express
  reordering; use the Phase 2 fact editor's `sortOrder` instead). Cover
  letters have no per-sentence review — approved coarsely, as a whole.
- No screening-question answers — no source exists anywhere in the app.
- No actual automated-submission adapter — every job routes through the
  manual "open the official page, download documents, confirm once you've
  submitted" flow (spec H's first half). `SUBMISSION_CONFIRMED` stays an
  unreachable status until a real approved API is integrated, at which
  point it needs its own dedicated test suite for spec H's second half
  (payload preview, explicit confirm-and-submit, logged response, no
  automatic retry).
- Application-tracker "reminders" are a visual badge only (`followUpDate`
  in the past/today) — no real notification/email system, which would need
  background-job infrastructure the spec defers.
- The Kanban tracker view uses a per-card status dropdown, not real
  drag-and-drop.
- PDF export is not implemented — DOCX only (spec's own "DOCX first" phrasing).
- Rate limiting is in-memory/single-process (`src/lib/rate-limit.ts`) — not
  Redis-backed, so it doesn't coordinate across multiple app instances.
  Fine for this MVP's single-instance deployment story.
- `JobSourceConnection.config` and résumé content are not encrypted at
  rest — no real value is ever written into the former (only `MOCK` is
  registered), and full at-rest encryption of the latter would need an
  accompanying KMS/secrets-management story out of scope for this MVP.
- Docker Compose runs the existing SQLite-backed app (a named volume
  persists the DB file) — it was not migrated to Postgres. `docker compose
  build`/`up` have not been exercised in this development environment (no
  Docker CLI available here); their first real run needs a human/CI
  environment with Docker installed.
- SQLite only; Postgres is not wired up (see [Database](#database) for the
  swap path).
- Résumé files are stored as `Bytes` in the database, not object storage —
  fine for an MVP at small scale, worth revisiting before real production use.
- The fact editor's per-type fields (`src/lib/resume/fact-field-config.ts`)
  are UI-only metadata; array fields (bullets, technologies) are edited as
  newline-separated text rather than a fully dynamic add/remove-row UI.
- No edit/delete UI for jobs this phase — manually-created jobs are
  mutable-by-creator only *in principle* (documented invariant in
  `src/server/data/jobs.ts`), but no page exercises that yet.
- CSV `required_skills`/`preferred_skills` cells use semicolons as the
  in-cell separator (commas are already the CSV delimiter) — not obvious
  without reading the column docs on `/jobs/import`.

## Roadmap

| Phase | Scope |
| ----- | ----- |
| 1 ✅  | Scaffold, architecture, auth, database schema |
| 2 ✅  | Résumé upload, parsing, structured editing, verification |
| 3 ✅  | Job-search profiles, manual URL/paste, CSV import, normalization, dedup |
| 4 ✅  | Filtering, scoring, AI comparison, schema validation, prompt-injection defenses |
| 5 ✅  | Tailored résumé generation, traceability, diff review, approval, DOCX export |
| 6 ✅  | Application assistance and tracking (manual submission unless an approved API is configured) |
| 7 ✅  | Rate limiting, account export/deletion, secrets-in-bundle verification, API/adapter docs, Docker Compose |

All seven phases are complete. See
[`../aacargo-clone/jobsApply.md`](../aacargo-clone/jobsApply.md) for the
complete phase-by-phase detail.

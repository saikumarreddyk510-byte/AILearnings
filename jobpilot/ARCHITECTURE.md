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
      search-profiles/                  # Phase 3: list + create/edit
        [id]/
      api/auth/[...nextauth]/route.ts
    components/ui/                      # shadcn
    server/
      auth/    (config.ts, session.ts, types.d.ts)
      data/    (users.ts, resumes.ts, jobs.ts, search-profiles.ts,
                matches.ts, ai-executions.ts, ...)  ← ownership-scoped queries
      actions/ (register.ts, sign-in.ts, sign-out.ts,
                resume-upload.ts, resume-text.ts, resume-facts.ts, resume-version.ts,
                jobs.ts, search-profiles.ts, matches.ts)
    lib/
      ai/          (types.ts, config.ts, generate.ts, providers/{mock,openai}.ts)
      job-sources/ (types.ts, mock.ts, registry.ts)
      resume/      (constants, file-signature, validate-upload, pdf, docx,
                    sanitize, heuristics, fact-schemas, fact-field-config)
      jobs/        (constants, fingerprint, normalize, csv, schemas)
      matching/    (json-utils, filters, score, schemas, prompt, analyze)
      enums.ts, db.ts, env.ts, utils.ts
    proxy.ts
  scripts/generate-resume-fixtures.ts   # devDependency-only fixture generator
  tests/{unit/, e2e/, fixtures/, helpers/}
```

Future phases have an obvious home: tailoring/diff review → `src/app/review/`
(Phase 5, also reuses `AIExecution` for `RESUME_TAILORING`/`COVER_LETTER`
purposes — see `src/server/data/ai-executions.ts`'s module comment);
application tracker → `src/app/applications/` (Phase 6); Docker/full test
suite → root `docker-compose.yml` (Phase 7).

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
- `tests/e2e/home.spec.ts`, `tests/e2e/resume-upload.spec.ts`,
  `tests/e2e/manual-job-entry.spec.ts`, and
  `tests/e2e/job-match-analysis.spec.ts` — Playwright: landing page smoke
  test, a full register → upload → extracted-text-renders round trip, a
  full register → add-a-job → appears-on-/jobs round trip, and a register
  → add-a-job → "verify a résumé first" prompt round trip (a full
  résumé-to-VERIFIED e2e round trip was judged too expensive for coverage
  the unit/integration tests already provide structurally — no test-only
  shortcut exists to seed a VERIFIED résumé outside the real UI).
- Schema-changing test setup deliberately applies `prisma/migrations/*/migration.sql`
  directly via `better-sqlite3` rather than invoking the `prisma` CLI —
  Prisma's CLI refuses schema-changing commands when it detects an AI
  coding agent invoking them without fresh explicit human consent, which is
  correct behavior to respect, not route around.

Full coverage (prompt-injection defenses, duplicate-submission guards,
schema-validation rejection at the application-tracker level, etc.) is
Phase 7 per the spec's delivery plan.

## Known limitations

- No real job-search API — only manual entry, CSV import, and the mock
  provider (a real permitted API is deferred to a future phase).
- No real AI calls — `AI_PROVIDER=mock` only; the OpenAI provider throws
  (Phase 5). Résumé fact extraction, job normalization, and match *scoring*
  are all mechanical/deterministic, not AI-assisted, by design (see "Job
  matching & analysis" above for the scoring deviation specifically) — only
  the match narrative (`concerns`/`explanation`) goes through the AI
  provider today, and even that is a static, honest stub under mock.
- Industry match and education/certification match (spec section E's
  scoring factor list) are not evaluated — no reliable structured field to
  compare against on either the résumé or job side yet.
- Experience-level and sponsorship hard filters are low-confidence keyword
  heuristics against free text, not structured comparisons — `Job` has no
  dedicated columns for either. Self-labeled as such in the UI.
- Rate/spending limits on AI calls are not implemented — deferred until a
  real, paid provider is wired (Phase 5+); meaningless against a free mock.
- No tailoring/diff-review UI, application tracker, or Docker Compose setup
  yet (Phases 5–7).
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
| 5     | Tailored résumé generation, traceability, diff review, approval, DOCX export |
| 6     | Application assistance and tracking (manual submission unless an approved API is configured) |
| 7     | Full test suite, security checks, documentation, Docker |

See [`../aacargo-clone/jobsApply.md`](../aacargo-clone/jobsApply.md) for
the complete phase-by-phase detail.

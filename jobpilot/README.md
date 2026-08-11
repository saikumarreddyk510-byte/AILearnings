# JobPilot

An AI-assisted job search and application assistant, built around one rule:
**nothing gets submitted without a human explicitly approving it.**

All **7 phases** are complete: scaffold/architecture/auth/schema, résumé
upload/parsing/structured editing, job-search profiles with manual/CSV job
ingestion + dedup, hard filters + deterministic match scoring + an
AI-generated match narrative, AI-assisted résumé tailoring + optional
cover letters with a full diff-review/approval workflow and DOCX export,
application assistance + a full tracker (submission stays manual — open
the official page, download your approved documents, and confirm once
you've actually submitted), and a hardening/packaging pass — rate
limiting, account data export/deletion, a secrets-in-client-bundle
verification script, expanded API/adapter documentation, and Docker
Compose. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design,
compliance rules, and roadmap, and
[`../aacargo-clone/jobsApply.md`](../aacargo-clone/jobsApply.md) for the
original product spec.

## Quick start

```bash
npm install
cp .env.example .env
# then edit .env: set a real AUTH_SECRET (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)

npx prisma migrate dev --name init   # creates dev.db (SQLite)
npm run dev                          # http://localhost:3000
```

Try it: create an account at `/register`, sign in at `/sign-in`, land on
`/dashboard`, then:
- go to `/resume` to upload a PDF/DOCX résumé and build out verified
  structured facts,
- go to `/search-profiles` to describe the roles you want,
- go to `/jobs` to add a job manually or `/jobs/import` to bulk-import a CSV
  (column reference documented on that page),
- once a résumé is verified, open any job and click "Analyze this job" for
  a score, matched/missing/transferable skills, hard-filter notes against
  a search profile of your choice, and an AI-generated explanation,
- then click "Review & tailor for this job" to generate an AI-suggested
  tailored résumé and optional cover letter, accept/reject/edit every
  proposed change, give final approval, and download the approved
  documents as DOCX,
- once approved, click "Continue to application" to open the official
  application page, download your documents, confirm once you've
  submitted, and track the result on `/applications` (table and Kanban
  views, with reminders for follow-up dates),
- visit `/settings` any time for account info and `/settings/privacy` to
  export all your data as JSON or permanently delete your account.

## Docker

```bash
cp .env.example .env   # then set a real AUTH_SECRET as above
docker compose build
docker compose run --rm app npx prisma migrate deploy   # first run only
docker compose up
```

The SQLite database lives in a named volume (`sqlite-data`), so it
survives rebuilds/restarts. See `ARCHITECTURE.md`'s "Security, privacy &
Docker" section for the SQLite-in-Docker rationale and known gotchas —
this hasn't been exercised against a real Docker installation in this
project's own development environment, so treat the first run as a
verification step, not an assumption.

## Scripts

| Script                | What it does                                   |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`           | Start the Next.js dev server                    |
| `npm run build`         | Production build                                |
| `npm run start`         | Run the production build                        |
| `npm run lint`          | ESLint                                          |
| `npm run typecheck`     | `tsc --noEmit`                                  |
| `npm run test`          | Vitest (unit tests)                             |
| `npm run test:e2e`      | Playwright (builds + starts the app, then runs) |
| `npm run verify:secrets`| Builds, then greps the client bundle for a dummy secret (see `ARCHITECTURE.md`) |
| `npm run db:migrate`    | `prisma migrate dev`                            |
| `npm run db:push`       | `prisma db push` (no migration file)            |
| `npm run db:seed`       | Run `prisma/seed.ts`                            |

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS + shadcn/ui
(Base UI) · Prisma 7 (SQLite dev datasource via
`@prisma/adapter-better-sqlite3`) · Auth.js v5 (Credentials + JWT) · Zod ·
`unpdf`/`mammoth` for résumé text extraction · `csv-parse` for job CSV
import · `docx` for tailored-résumé/cover-letter DOCX generation.

To regenerate the résumé test fixtures (PDF/DOCX with known content):

```bash
npx tsx --conditions=react-server scripts/generate-resume-fixtures.ts
```

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md).

# JobPilot

An AI-assisted job search and application assistant, built around one rule:
**nothing gets submitted without a human explicitly approving it.**

This is **Phases 1–4** of a 7-phase build: scaffold/architecture/auth/schema,
résumé upload/parsing/structured editing, job-search profiles with
manual/CSV job ingestion + dedup, and hard filters + deterministic match
scoring + an AI-generated match narrative. No résumé tailoring/cover
letters yet. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full
design, compliance rules, and roadmap, and
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
  a search profile of your choice, and an AI-generated explanation.

## Scripts

| Script              | What it does                                   |
| -------------------- | ----------------------------------------------- |
| `npm run dev`         | Start the Next.js dev server                    |
| `npm run build`       | Production build                                |
| `npm run start`       | Run the production build                        |
| `npm run lint`        | ESLint                                          |
| `npm run typecheck`   | `tsc --noEmit`                                  |
| `npm run test`        | Vitest (unit tests)                             |
| `npm run test:e2e`    | Playwright (builds + starts the app, then runs) |
| `npm run db:migrate`  | `prisma migrate dev`                            |
| `npm run db:push`     | `prisma db push` (no migration file)            |
| `npm run db:seed`     | Run `prisma/seed.ts`                            |

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS + shadcn/ui
(Base UI) · Prisma 7 (SQLite dev datasource via
`@prisma/adapter-better-sqlite3`) · Auth.js v5 (Credentials + JWT) · Zod ·
`unpdf`/`mammoth` for résumé text extraction · `csv-parse` for job CSV import.

To regenerate the résumé test fixtures (PDF/DOCX with known content):

```bash
npx tsx --conditions=react-server scripts/generate-resume-fixtures.ts
```

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md).

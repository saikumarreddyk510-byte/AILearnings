// Runs before every Vitest test file. Guarantees required env vars are set
// (so src/lib/env.ts validation never fails) and points DATABASE_URL at a
// dedicated test SQLite file, isolated from prisma/dev.db.
process.env.DATABASE_URL = "file:./prisma/test.db";
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ?? "vitest-only-secret-not-for-production-use";
process.env.AUTH_URL = process.env.AUTH_URL ?? "http://localhost:3000";
process.env.AI_PROVIDER = "mock";
// NODE_ENV is typed read-only by @types/node; Vitest already sets it to
// "test" before running any test file, so there's nothing to do here.

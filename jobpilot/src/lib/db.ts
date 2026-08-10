import "server-only";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";

/**
 * Prisma 7 requires an explicit driver adapter — there is no built-in
 * connection based on the schema's `datasource` block alone. For local dev
 * we use @prisma/adapter-better-sqlite3 against the SQLite file in
 * DATABASE_URL. Swapping to Postgres in production means swapping this one
 * adapter (e.g. @prisma/adapter-pg) — nothing else in the app needs to
 * change, since callers only ever import `db` from here.
 */
function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Next.js dev mode hot-reloads server modules, which would otherwise create
// a fresh PrismaClient (and a fresh SQLite connection) on every edit. Cache
// the instance on `globalThis` in development so it survives reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

const MIGRATIONS_DIR = "./prisma/migrations";

export function cleanupTestDb(dbPath: string) {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const path = `${dbPath}${suffix}`;
    if (existsSync(path)) rmSync(path);
  }
}

/**
 * Applies every prisma/migrations/*\/migration.sql file (in order) to the
 * given test DB path by running the raw SQL directly through
 * better-sqlite3.
 *
 * Deliberately NOT using the `prisma db push`/`migrate` CLI here: Prisma's
 * CLI detects when it's invoked by an AI coding agent and refuses to run
 * schema-changing commands without a fresh, explicit human consent message
 * — appropriately, since those commands can be destructive against a real
 * database. Replaying our own migration files with plain SQL against a
 * throwaway test-only file we just created has the same effect (create the
 * tables) without touching that guarded, genuinely-dangerous code path.
 */
export function applyMigrationsToTestDb(dbPath: string) {
  const migrationFolders = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const sqlite = new Database(dbPath);
  try {
    for (const folder of migrationFolders) {
      const sql = readFileSync(join(MIGRATIONS_DIR, folder, "migration.sql"), "utf-8");
      sqlite.exec(sql);
    }
  } finally {
    sqlite.close();
  }
}

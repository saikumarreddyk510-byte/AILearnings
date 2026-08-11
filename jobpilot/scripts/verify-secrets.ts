/**
 * Proves the spec's "Secrets are not exposed in client bundles or logs"
 * requirement structurally, not just by convention. Depends on a
 * completed production build (~1-2 min) so it can't be a plain
 * `vitest run` test (doesn't fit that fast-feedback model) — it's its own
 * command, run manually or in CI:
 *
 *   npm run verify:secrets
 *
 * What it does:
 *   1. Generates a random, distinctive token.
 *   2. Runs `next build` with that token injected as OPENAI_API_KEY (plus
 *      AI_PROVIDER=openai, so the "real provider" code path is actually
 *      compiled — not just the mock stub).
 *   3. Recursively scans .next/static/**\/*.js ONLY (browser-shipped code
 *      — never .next/server, which legitimately contains env values;
 *      that's not a leak) for the token.
 *   4. Exits 1 with the offending file paths if found; exits 0 with a
 *      files-scanned count otherwise.
 *
 * This is a regression guard against a future accidental NEXT_PUBLIC_-
 * prefixed secret, or a "use client" file importing @/lib/env directly.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const STATIC_DIR = join(process.cwd(), ".next", "static");
// Matches the existing /prisma/test*.db .gitignore pattern — never a real
// database, safe to create and discard.
const BUILD_DB_PATH = join(process.cwd(), "prisma", "test-verify-secrets.db");

function walkJsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      results.push(...walkJsFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const token = randomBytes(16).toString("hex");
  console.log(`Building with a distinctive dummy secret (${token.slice(0, 8)}…) to verify it never reaches the client bundle...`);

  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      OPENAI_API_KEY: token,
      AI_PROVIDER: "openai",
      DATABASE_URL: process.env.DATABASE_URL ?? `file:${BUILD_DB_PATH}`,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "verify-secrets-build-only-placeholder",
    },
  });

  if (existsSync(BUILD_DB_PATH)) rmSync(BUILD_DB_PATH);

  if (result.status !== 0) {
    console.error("Build failed — cannot verify the client bundle.");
    process.exit(result.status ?? 1);
  }

  const files = walkJsFiles(STATIC_DIR);
  const offending: string[] = [];

  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    if (content.includes(token)) {
      offending.push(file);
    }
  }

  if (offending.length > 0) {
    console.error(`FAIL: the dummy secret was found in ${offending.length} client bundle file(s):`);
    for (const file of offending) console.error(`  - ${file}`);
    process.exit(1);
  }

  console.log(`PASS: scanned ${files.length} client bundle file(s) under .next/static — no secret found.`);
}

main();

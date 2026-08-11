import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Unlike the unit/integration suite (tests/helpers/test-db.ts gives every
  // test file its own dedicated SQLite file), e2e specs all run against the
  // one shared dev.db behind `npm run build && npm run start` below — there
  // is no per-worker isolation. Running workers in parallel here causes
  // intermittent SQLite write contention during concurrent registration
  // (surfaced once the suite grew past a handful of specs), not a real
  // product bug. Serialized to keep the suite deterministic.
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

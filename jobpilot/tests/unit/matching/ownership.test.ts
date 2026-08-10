import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { getLatestJobMatchForUser as GetFn } from "@/server/data/matches";

const TEST_DB_PATH = "./prisma/test-job-match-ownership.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("row-level ownership: JobMatch", () => {
  let db: typeof DbClient;
  let getLatestJobMatchForUser: typeof GetFn;

  let userAId: string;
  let userBId: string;
  let jobId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ getLatestJobMatchForUser } = await import("@/server/data/matches"));

    const userA = await db.user.create({
      data: { email: "match-owner-a@example.com", passwordHash: "not-a-real-hash" },
    });
    const userB = await db.user.create({
      data: { email: "match-owner-b@example.com", passwordHash: "not-a-real-hash" },
    });
    userAId = userA.id;
    userBId = userB.id;

    const job = await db.job.create({
      data: {
        source: "MOCK",
        sourceJobId: "shared-job-1",
        sourceUrl: "https://example.com/job",
        company: "Acme",
        title: "Engineer",
        description: "Build things.",
        contentFingerprint: "fp-shared",
        createdByUserId: null,
      },
    });
    jobId = job.id;

    await db.jobMatch.create({
      data: {
        userId: userAId,
        jobId,
        score: 80,
        matchedRequirements: [],
        missingRequirements: [],
        transferableSkills: [],
        hardFilterFailures: [],
        concerns: [],
        explanation: "User A's private analysis.",
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns the match to the user who ran the analysis", async () => {
    const match = await getLatestJobMatchForUser(jobId, userAId);
    expect(match?.explanation).toBe("User A's private analysis.");
  });

  it("does not return another user's analysis of the same shared job", async () => {
    const match = await getLatestJobMatchForUser(jobId, userBId);
    expect(match).toBeNull();
  });
});

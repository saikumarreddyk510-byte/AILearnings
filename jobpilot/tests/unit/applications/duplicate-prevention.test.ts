import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { getOrCreateApplicationForUser as GateFn } from "@/server/data/applications";

const TEST_DB_PATH = "./prisma/test-applications-dedup.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("getOrCreateApplicationForUser (duplicate-application prevention)", () => {
  let db: typeof DbClient;
  let getOrCreateApplicationForUser: typeof GateFn;

  let userId: string;
  let jobId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ getOrCreateApplicationForUser } = await import("@/server/data/applications"));

    const user = await db.user.create({
      data: { email: "dedup@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;

    const resume = await db.masterResume.create({
      data: {
        userId,
        originalFileName: "resume.pdf",
        originalMimeType: "application/pdf",
        originalFileData: Buffer.from("fake"),
        status: "VERIFIED",
      },
    });
    const version = await db.resumeVersion.create({
      data: { masterResumeId: resume.id, versionNumber: 1, snapshot: { extractedText: null, facts: [] } },
    });

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "dedup-1",
        sourceUrl: "https://example.com/dedup-1",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-dedup-1",
        createdByUserId: userId,
      },
    });
    jobId = job.id;

    const jobMatch = await db.jobMatch.create({
      data: {
        userId,
        jobId,
        score: 80,
        matchedRequirements: [],
        missingRequirements: [],
        transferableSkills: [],
        hardFilterFailures: [],
        concerns: [],
        explanation: "n/a",
      },
    });

    await db.tailoredResume.create({
      data: {
        jobMatchId: jobMatch.id,
        baseVersionId: version.id,
        content: { facts: [] },
        recommendedChanges: [],
        status: "APPROVED",
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("two calls for the same (userId, jobId) return the same application and never duplicate", async () => {
    const first = await getOrCreateApplicationForUser(userId, jobId);
    const second = await getOrCreateApplicationForUser(userId, jobId);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.application.id).toBe(first.application.id);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);

    const count = await db.application.count({ where: { userId, jobId } });
    expect(count).toBe(1);
  });
});

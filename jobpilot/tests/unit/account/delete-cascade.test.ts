import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { deleteAccountForUser as DeleteFn } from "@/server/data/account";

const TEST_DB_PATH = "./prisma/test-account-delete-cascade.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("deleteAccountForUser (cascade sanity)", () => {
  let db: typeof DbClient;
  let deleteAccountForUser: typeof DeleteFn;

  let userId: string;
  let sharedJobId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ deleteAccountForUser } = await import("@/server/data/account"));

    const user = await db.user.create({
      data: { email: "cascade@example.com", passwordHash: "hash" },
    });
    userId = user.id;

    await db.userPreference.create({ data: { userId } });

    await db.masterResume.create({
      data: {
        userId,
        originalFileName: "resume.pdf",
        originalMimeType: "application/pdf",
        originalFileData: Buffer.from("fake"),
        status: "VERIFIED",
      },
    });

    await db.searchProfile.create({
      data: { userId, name: "My search", targetRoleTitles: ["Engineer"] },
    });

    await db.jobSourceConnection.create({ data: { userId, sourceType: "MOCK" } });

    // A SHARED job (createdByUserId: null) — must survive the user's
    // deletion; only the user's PRIVATE jobs are hard-deleted.
    const sharedJob = await db.job.create({
      data: {
        source: "MOCK",
        sourceJobId: "cascade-shared-1",
        sourceUrl: "https://example.com/cascade-shared-1",
        company: "Acme",
        title: "Shared role",
        description: "n/a",
        contentFingerprint: "fp-cascade-shared-1",
        createdByUserId: null,
      },
    });
    sharedJobId = sharedJob.id;

    const jobMatch = await db.jobMatch.create({
      data: {
        userId,
        jobId: sharedJobId,
        score: 80,
        matchedRequirements: [],
        missingRequirements: [],
        transferableSkills: [],
        hardFilterFailures: [],
        concerns: [],
        explanation: "n/a",
      },
    });

    await db.application.create({
      data: { userId, jobId: sharedJobId, status: "READY_TO_APPLY" },
    });

    await db.aIExecution.create({
      data: {
        userId,
        purpose: "MATCH_ANALYSIS",
        provider: "mock",
        model: "mock-1",
        promptVersion: "v1",
        status: "SUCCEEDED",
      },
    });

    void jobMatch;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("removes every child row owned by the user, but leaves the shared job intact", async () => {
    await deleteAccountForUser(userId);

    expect(await db.user.findUnique({ where: { id: userId } })).toBeNull();
    expect(await db.userPreference.findFirst({ where: { userId } })).toBeNull();
    expect(await db.masterResume.findMany({ where: { userId } })).toHaveLength(0);
    expect(await db.searchProfile.findMany({ where: { userId } })).toHaveLength(0);
    expect(await db.jobSourceConnection.findMany({ where: { userId } })).toHaveLength(0);
    expect(await db.jobMatch.findMany({ where: { userId } })).toHaveLength(0);
    expect(await db.application.findMany({ where: { userId } })).toHaveLength(0);
    expect(await db.aIExecution.findMany({ where: { userId } })).toHaveLength(0);

    // The shared job itself was never owned by this user — it survives.
    const sharedJob = await db.job.findUnique({ where: { id: sharedJobId } });
    expect(sharedJob).not.toBeNull();
  });

  it("keeps the ACCOUNT_DELETED audit event, with userId nulled out", async () => {
    const event = await db.auditEvent.findFirst({
      where: { action: "ACCOUNT_DELETED", entityId: userId },
    });
    expect(event).not.toBeNull();
    expect(event?.userId).toBeNull();
  });
});

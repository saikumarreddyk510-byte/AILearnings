import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { createManualJobForUser as CreateManualJobFn } from "@/server/data/jobs";
import type { normalizeJobInput as NormalizeFn } from "@/lib/jobs/normalize";

const TEST_DB_PATH = "./prisma/test-manual-job-dedup.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const JOB_INPUT = {
  company: "Acme Corp",
  title: "Senior Engineer",
  description: "Build the thing.",
  sourceUrl: "https://example.com/job/1",
};

describe("createManualJobForUser: privacy-scoped dedup", () => {
  let db: typeof DbClient;
  let createManualJobForUser: typeof CreateManualJobFn;
  let normalizeJobInput: typeof NormalizeFn;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ createManualJobForUser } = await import("@/server/data/jobs"));
    ({ normalizeJobInput } = await import("@/lib/jobs/normalize"));

    const userA = await db.user.create({
      data: { email: "dedup-a@example.com", passwordHash: "not-a-real-hash" },
    });
    const userB = await db.user.create({
      data: { email: "dedup-b@example.com", passwordHash: "not-a-real-hash" },
    });
    userAId = userA.id;
    userBId = userB.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("does not create a duplicate row when the same user submits the same job twice", async () => {
    const normalized = normalizeJobInput(JOB_INPUT);

    const first = await createManualJobForUser(userAId, normalized, "MANUAL_PASTE");
    expect(first.duplicate).toBe(false);

    const second = await createManualJobForUser(userAId, normalized, "MANUAL_PASTE");
    expect(second.duplicate).toBe(true);
    expect(second.job.id).toBe(first.job.id);

    const count = await db.job.count({
      where: { contentFingerprint: normalized.contentFingerprint, createdByUserId: userAId },
    });
    expect(count).toBe(1);
  });

  it("creates a separate private row when a different user submits identical content", async () => {
    const normalized = normalizeJobInput({
      ...JOB_INPUT,
      sourceUrl: "https://example.com/job/1-again", // sourceUrl isn't part of the fingerprint
    });

    const result = await createManualJobForUser(userBId, normalized, "MANUAL_PASTE");
    // Must NOT be flagged a duplicate — a fingerprint match against
    // another user's *private* job must never leak that job's existence.
    expect(result.duplicate).toBe(false);
    expect(result.job.createdByUserId).toBe(userBId);

    const totalWithFingerprint = await db.job.count({
      where: { contentFingerprint: normalized.contentFingerprint },
    });
    expect(totalWithFingerprint).toBe(2); // one private row per user
  });
});

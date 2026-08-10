import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  getJobByIdVisibleToUser as GetFn,
  listJobsVisibleToUser as ListFn,
} from "@/server/data/jobs";

const TEST_DB_PATH = "./prisma/test-job-visibility.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("job visibility: shared catalog vs. private manual/CSV jobs", () => {
  let db: typeof DbClient;
  let listJobsVisibleToUser: typeof ListFn;
  let getJobByIdVisibleToUser: typeof GetFn;

  let userAId: string;
  let userBId: string;
  let privateJobId: string;
  let sharedJobId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ listJobsVisibleToUser, getJobByIdVisibleToUser } = await import("@/server/data/jobs"));

    const userA = await db.user.create({
      data: { email: "visibility-a@example.com", passwordHash: "not-a-real-hash" },
    });
    const userB = await db.user.create({
      data: { email: "visibility-b@example.com", passwordHash: "not-a-real-hash" },
    });
    userAId = userA.id;
    userBId = userB.id;

    const privateJob = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "private-1",
        sourceUrl: "https://example.com/private",
        company: "Private Co",
        title: "Private Role",
        description: "Only user A should see this.",
        contentFingerprint: "fingerprint-private",
        createdByUserId: userAId,
      },
    });
    privateJobId = privateJob.id;

    const sharedJob = await db.job.create({
      data: {
        source: "MOCK",
        sourceJobId: "shared-1",
        sourceUrl: "https://example.com/shared",
        company: "Shared Co",
        title: "Shared Role",
        description: "Everyone should see this.",
        contentFingerprint: "fingerprint-shared",
        createdByUserId: null,
      },
    });
    sharedJobId = sharedJob.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("shows a private job to its creator", async () => {
    const job = await getJobByIdVisibleToUser(privateJobId, userAId);
    expect(job?.id).toBe(privateJobId);
  });

  it("hides a private job from a different user", async () => {
    const job = await getJobByIdVisibleToUser(privateJobId, userBId);
    expect(job).toBeNull();

    const list = await listJobsVisibleToUser(userBId);
    expect(list.find((j) => j.id === privateJobId)).toBeUndefined();
  });

  it("shows a shared (null-owner) job to every user", async () => {
    const forA = await getJobByIdVisibleToUser(sharedJobId, userAId);
    const forB = await getJobByIdVisibleToUser(sharedJobId, userBId);
    expect(forA?.id).toBe(sharedJobId);
    expect(forB?.id).toBe(sharedJobId);
  });

  it("includes both the owner's private jobs and shared jobs in their list", async () => {
    const list = await listJobsVisibleToUser(userAId);
    const ids = list.map((j) => j.id);
    expect(ids).toContain(privateJobId);
    expect(ids).toContain(sharedJobId);
  });
});

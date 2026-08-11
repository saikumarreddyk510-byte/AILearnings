import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { deleteAccountForUser as DeleteFn } from "@/server/data/account";
import type { getJobByIdVisibleToUser as GetJobFn } from "@/server/data/jobs";

const TEST_DB_PATH = "./prisma/test-account-delete-privacy.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("deleteAccountForUser (private-job privacy fix)", () => {
  let db: typeof DbClient;
  let deleteAccountForUser: typeof DeleteFn;
  let getJobByIdVisibleToUser: typeof GetJobFn;

  let userAId: string;
  let userBId: string;
  let privateJobId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ deleteAccountForUser } = await import("@/server/data/account"));
    ({ getJobByIdVisibleToUser } = await import("@/server/data/jobs"));

    const userA = await db.user.create({
      data: { email: "privacy-a@example.com", passwordHash: "hash-a" },
    });
    const userB = await db.user.create({
      data: { email: "privacy-b@example.com", passwordHash: "hash-b" },
    });
    userAId = userA.id;
    userBId = userB.id;

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "privacy-leak-1",
        sourceUrl: "https://example.com/privacy-leak-1",
        company: "Acme",
        title: "A private role only User A should ever see",
        description: "Sensitive text User A pasted in privately.",
        contentFingerprint: "fp-privacy-leak-1",
        createdByUserId: userAId,
      },
    });
    privateJobId = job.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("the private job is invisible to another user before deletion (sanity check)", async () => {
    const visibleToB = await getJobByIdVisibleToUser(privateJobId, userBId);
    expect(visibleToB).toBeNull();
  });

  it("hard-deletes the owner's private job on account deletion, rather than promoting it to shared", async () => {
    await deleteAccountForUser(userAId);

    // The critical assertion: the job row is GONE, not merely still
    // invisible — a naive db.user.delete() would instead null out
    // createdByUserId via the schema's SetNull cascade, which (per
    // src/server/data/jobs.ts's visibility rule) would silently make it
    // shared/visible to everyone. Directly querying the raw row (bypassing
    // the visibility-scoped helper) proves it's actually gone.
    const rawRow = await db.job.findUnique({ where: { id: privateJobId } });
    expect(rawRow).toBeNull();

    // And, redundantly, confirm it never becomes visible to User B either.
    const visibleToB = await getJobByIdVisibleToUser(privateJobId, userBId);
    expect(visibleToB).toBeNull();
  });
});

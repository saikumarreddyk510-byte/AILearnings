import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  getApplicationByJobIdForUser as GetByJobFn,
  getApplicationByIdForUser as GetByIdFn,
  confirmApplicationSubmissionForUser as ConfirmFn,
  recordApplicationOutcomeForUser as RecordFn,
  updateApplicationDetailsForUser as UpdateFn,
} from "@/server/data/applications";

const TEST_DB_PATH = "./prisma/test-applications-ownership.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("row-level ownership: Application", () => {
  let db: typeof DbClient;
  let getApplicationByJobIdForUser: typeof GetByJobFn;
  let getApplicationByIdForUser: typeof GetByIdFn;
  let confirmApplicationSubmissionForUser: typeof ConfirmFn;
  let recordApplicationOutcomeForUser: typeof RecordFn;
  let updateApplicationDetailsForUser: typeof UpdateFn;

  let userAId: string;
  let userBId: string;
  let jobId: string;
  let applicationId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({
      getApplicationByJobIdForUser,
      getApplicationByIdForUser,
      confirmApplicationSubmissionForUser,
      recordApplicationOutcomeForUser,
      updateApplicationDetailsForUser,
    } = await import("@/server/data/applications"));

    const userA = await db.user.create({
      data: { email: "app-owner-a@example.com", passwordHash: "not-a-real-hash" },
    });
    const userB = await db.user.create({
      data: { email: "app-owner-b@example.com", passwordHash: "not-a-real-hash" },
    });
    userAId = userA.id;
    userBId = userB.id;

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "own-1",
        sourceUrl: "https://example.com/own-1",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-own-1",
        createdByUserId: userAId,
      },
    });
    jobId = job.id;

    const application = await db.application.create({
      data: { userId: userAId, jobId, status: "APPLIED", dateApplied: new Date() },
    });
    applicationId = application.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns the application to its owner", async () => {
    const found = await getApplicationByJobIdForUser(jobId, userAId);
    expect(found?.id).toBe(applicationId);
  });

  it("does not return another user's application by job id", async () => {
    const found = await getApplicationByJobIdForUser(jobId, userBId);
    expect(found).toBeNull();
  });

  it("does not return another user's application by direct id lookup", async () => {
    const found = await getApplicationByIdForUser(applicationId, userBId);
    expect(found).toBeNull();
  });

  it("confirmApplicationSubmissionForUser cannot be used by a non-owner", async () => {
    const result = await confirmApplicationSubmissionForUser(applicationId, userBId, new Date());
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("recordApplicationOutcomeForUser cannot be used by a non-owner", async () => {
    const result = await recordApplicationOutcomeForUser(applicationId, userBId, "REJECTED");
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("updateApplicationDetailsForUser cannot be used by a non-owner", async () => {
    const ok = await updateApplicationDetailsForUser(applicationId, userBId, { notes: "hijacked" });
    expect(ok).toBe(false);

    const refetched = await db.application.findUnique({ where: { id: applicationId } });
    expect(refetched?.notes).not.toBe("hijacked");
  });
});

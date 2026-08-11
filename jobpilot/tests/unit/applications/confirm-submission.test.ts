import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { confirmApplicationSubmissionForUser as ConfirmFn } from "@/server/data/applications";

const TEST_DB_PATH = "./prisma/test-applications-confirm.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("confirmApplicationSubmissionForUser (double-click safety)", () => {
  let db: typeof DbClient;
  let confirmApplicationSubmissionForUser: typeof ConfirmFn;

  let userId: string;
  let applicationId: string;
  const firstDate = new Date("2026-08-01T00:00:00.000Z");
  const secondDate = new Date("2026-08-02T00:00:00.000Z");

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ confirmApplicationSubmissionForUser } = await import("@/server/data/applications"));

    const user = await db.user.create({
      data: { email: "confirm@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "confirm-1",
        sourceUrl: "https://example.com/confirm-1",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-confirm-1",
        createdByUserId: userId,
      },
    });

    const application = await db.application.create({
      data: { userId, jobId: job.id, status: "READY_TO_APPLY" },
    });
    applicationId = application.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("two sequential calls produce exactly one APPLIED ApplicationEvent, and the second is a safe no-op", async () => {
    const first = await confirmApplicationSubmissionForUser(applicationId, userId, firstDate);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.application.status).toBe("APPLIED");
    expect(first.application.dateApplied?.toISOString()).toBe(firstDate.toISOString());

    const second = await confirmApplicationSubmissionForUser(applicationId, userId, secondDate);
    expect(second).toMatchObject({ ok: false, error: "ALREADY_SUBMITTED" });

    // dateApplied from the first call is unchanged by the second.
    const refetched = await db.application.findUniqueOrThrow({ where: { id: applicationId } });
    expect(refetched.dateApplied?.toISOString()).toBe(firstDate.toISOString());

    const events = await db.applicationEvent.findMany({
      where: { applicationId, toStatus: "APPLIED" },
    });
    expect(events).toHaveLength(1);
  });

  it("returns NOT_FOUND for a nonexistent application id", async () => {
    const result = await confirmApplicationSubmissionForUser("does-not-exist", userId, new Date());
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });
});

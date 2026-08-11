import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { recordApplicationOutcomeForUser as RecordFn } from "@/server/data/applications";
import { RecordOutcomeInputSchema } from "@/lib/applications/schemas";

const TEST_DB_PATH = "./prisma/test-applications-outcomes.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("RecordOutcomeInputSchema (structural exclusion)", () => {
  it("rejects APPLIED / READY_TO_APPLY / SUBMISSION_CONFIRMED as a toStatus", () => {
    for (const toStatus of ["APPLIED", "READY_TO_APPLY", "SUBMISSION_CONFIRMED"]) {
      expect(() => RecordOutcomeInputSchema.parse({ toStatus })).toThrow();
    }
  });

  it("accepts REJECTED / INTERVIEW / OFFER / WITHDRAWN", () => {
    for (const toStatus of ["REJECTED", "INTERVIEW", "OFFER", "WITHDRAWN"]) {
      expect(() => RecordOutcomeInputSchema.parse({ toStatus })).not.toThrow();
    }
  });
});

describe("recordApplicationOutcomeForUser", () => {
  let db: typeof DbClient;
  let recordApplicationOutcomeForUser: typeof RecordFn;

  let userId: string;

  async function seedApplication(status: string) {
    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: `outcome-${Date.now()}-${Math.random()}`,
        sourceUrl: "https://example.com/outcome",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: `fp-outcome-${Date.now()}-${Math.random()}`,
        createdByUserId: userId,
      },
    });
    return db.application.create({ data: { userId, jobId: job.id, status } });
  }

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ recordApplicationOutcomeForUser } = await import("@/server/data/applications"));

    const user = await db.user.create({
      data: { email: "outcomes@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("APPLIED -> INTERVIEW -> OFFER writes one correctly-shaped ApplicationEvent per hop", async () => {
    const application = await seedApplication("APPLIED");

    const toInterview = await recordApplicationOutcomeForUser(application.id, userId, "INTERVIEW");
    expect(toInterview.ok).toBe(true);

    const toOffer = await recordApplicationOutcomeForUser(application.id, userId, "OFFER");
    expect(toOffer.ok).toBe(true);
    if (!toOffer.ok) return;
    expect(toOffer.application.status).toBe("OFFER");

    const events = await db.applicationEvent.findMany({
      where: { applicationId: application.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ fromStatus: "APPLIED", toStatus: "INTERVIEW" });
    expect(events[1]).toMatchObject({ fromStatus: "INTERVIEW", toStatus: "OFFER" });
  });

  it("rejects being called against a READY_TO_APPLY row — you can't skip the confirmed-submission step", async () => {
    const application = await seedApplication("READY_TO_APPLY");

    const result = await recordApplicationOutcomeForUser(application.id, userId, "OFFER");
    expect(result).toEqual({ ok: false, error: "NOT_YET_APPLIED" });

    const events = await db.applicationEvent.findMany({ where: { applicationId: application.id } });
    expect(events).toHaveLength(0);
  });

  it("returns NOT_FOUND for a nonexistent application", async () => {
    const result = await recordApplicationOutcomeForUser("does-not-exist", userId, "REJECTED");
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });
});

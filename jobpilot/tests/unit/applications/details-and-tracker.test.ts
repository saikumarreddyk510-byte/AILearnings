import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  updateApplicationDetailsForUser as UpdateFn,
  listApplicationsForUser as ListFn,
} from "@/server/data/applications";

const TEST_DB_PATH = "./prisma/test-applications-details.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("updateApplicationDetailsForUser / listApplicationsForUser", () => {
  let db: typeof DbClient;
  let updateApplicationDetailsForUser: typeof UpdateFn;
  let listApplicationsForUser: typeof ListFn;

  let userId: string;
  let applicationId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ updateApplicationDetailsForUser, listApplicationsForUser } = await import(
      "@/server/data/applications"
    ));

    const user = await db.user.create({
      data: { email: "details@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "details-1",
        sourceUrl: "https://example.com/details-1",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-details-1",
        createdByUserId: userId,
      },
    });

    const application = await db.application.create({
      data: { userId, jobId: job.id, status: "APPLIED", dateApplied: new Date() },
    });
    applicationId = application.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("persists notes/followUpDate/contactInfo/interviewDates without touching status or writing an event", async () => {
    const followUpDate = new Date("2026-09-01T00:00:00.000Z");
    const ok = await updateApplicationDetailsForUser(applicationId, userId, {
      notes: "Recruiter said 1 week.",
      followUpDate,
      contactInfo: { name: "Jamie Recruiter", email: "jamie@acme.example" },
      interviewDates: [{ date: "2026-09-10", note: "Phone screen" }],
    });
    expect(ok).toBe(true);

    const refetched = await db.application.findUniqueOrThrow({ where: { id: applicationId } });
    expect(refetched.notes).toBe("Recruiter said 1 week.");
    expect(refetched.followUpDate?.toISOString()).toBe(followUpDate.toISOString());
    expect(refetched.contactInfo).toMatchObject({ name: "Jamie Recruiter" });
    expect(refetched.interviewDates).toMatchObject([{ date: "2026-09-10" }]);
    expect(refetched.status).toBe("APPLIED"); // untouched

    const events = await db.applicationEvent.findMany({ where: { applicationId } });
    expect(events).toHaveLength(0);
  });

  it("listApplicationsForUser returns the job/tailoredResume/coverLetter relations for the tracker", async () => {
    const applications = await listApplicationsForUser(userId);
    expect(applications).toHaveLength(1);
    expect(applications[0].job.company).toBe("Acme");
  });
});

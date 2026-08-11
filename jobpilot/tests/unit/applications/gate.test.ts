import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  getOrCreateApplicationForUser as GateFn,
  confirmApplicationSubmissionForUser as ConfirmFn,
} from "@/server/data/applications";

const TEST_DB_PATH = "./prisma/test-applications-gate.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("getOrCreateApplicationForUser (human-approval gate)", () => {
  let db: typeof DbClient;
  let getOrCreateApplicationForUser: typeof GateFn;
  let confirmApplicationSubmissionForUser: typeof ConfirmFn;

  let userId: string;

  async function seedJobAndMatch(sourceJobId: string) {
    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId,
        sourceUrl: `https://example.com/${sourceJobId}`,
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: `fp-${sourceJobId}`,
        createdByUserId: userId,
      },
    });
    const jobMatch = await db.jobMatch.create({
      data: {
        userId,
        jobId: job.id,
        score: 80,
        matchedRequirements: [],
        missingRequirements: [],
        transferableSkills: [],
        hardFilterFailures: [],
        concerns: [],
        explanation: "n/a",
      },
    });
    return { job, jobMatch };
  }

  async function seedTailoredResume(jobMatchId: string, status: "DRAFT" | "APPROVED") {
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
    return db.tailoredResume.create({
      data: {
        jobMatchId,
        baseVersionId: version.id,
        content: { facts: [] },
        recommendedChanges: [],
        status,
      },
    });
  }

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ getOrCreateApplicationForUser, confirmApplicationSubmissionForUser } = await import(
      "@/server/data/applications"
    ));

    const user = await db.user.create({
      data: { email: "gate@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns NO_JOB_MATCH when the job has never been analyzed", async () => {
    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "no-match",
        sourceUrl: "https://example.com/no-match",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-no-match",
        createdByUserId: userId,
      },
    });
    const result = await getOrCreateApplicationForUser(userId, job.id);
    expect(result).toEqual({ ok: false, error: "NO_JOB_MATCH" });
  });

  it("returns NO_APPROVED_TAILORED_RESUME while the tailored résumé is still DRAFT", async () => {
    const { job, jobMatch } = await seedJobAndMatch("draft-tr");
    await seedTailoredResume(jobMatch.id, "DRAFT");

    const result = await getOrCreateApplicationForUser(userId, job.id);
    expect(result).toEqual({ ok: false, error: "NO_APPROVED_TAILORED_RESUME" });
  });

  it("succeeds once the tailored résumé is APPROVED, even with no cover letter at all", async () => {
    const { job, jobMatch } = await seedJobAndMatch("approved-tr");
    await seedTailoredResume(jobMatch.id, "APPROVED");

    const result = await getOrCreateApplicationForUser(userId, job.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.application.status).toBe("READY_TO_APPLY");
    expect(result.application.coverLetterId).toBeNull();
    expect(result.created).toBe(true);
  });

  it("returns JOB_NOT_FOUND for a nonexistent job", async () => {
    const result = await getOrCreateApplicationForUser(userId, "does-not-exist");
    expect(result).toEqual({ ok: false, error: "JOB_NOT_FOUND" });
  });

  it("confirmApplicationSubmissionForUser rejects a row that was never READY_TO_APPLY (guard is self-contained)", async () => {
    const { job, jobMatch } = await seedJobAndMatch("draft-app-guard");
    const tailoredResume = await seedTailoredResume(jobMatch.id, "APPROVED");

    // Seed an Application directly at DRAFT, bypassing getOrCreateApplicationForUser,
    // to prove confirmApplicationSubmissionForUser doesn't just work "because
    // nothing else creates a bad row" — it independently refuses to transition
    // anything that isn't already READY_TO_APPLY.
    const application = await db.application.create({
      data: {
        userId,
        jobId: job.id,
        tailoredResumeId: tailoredResume.id,
        status: "DRAFT",
      },
    });

    const result = await confirmApplicationSubmissionForUser(application.id, userId, new Date());
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // DRAFT never matches the READY_TO_APPLY guard, so this looks identical
    // to "already submitted" from the guard's point of view — either way,
    // nothing was transitioned.
    expect(result.error).toBe("ALREADY_SUBMITTED");

    const refetched = await db.application.findUnique({ where: { id: application.id } });
    expect(refetched?.status).toBe("DRAFT");
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  getLatestTailoredResumeForJobMatch as GetTailoredFn,
  getTailoredResumeByIdForUser as GetTailoredByIdFn,
  createTailoredResumeForUser as CreateTailoredFn,
  recordReviewDecisionForUser as RecordDecisionFn,
} from "@/server/data/tailored-resumes";
import type {
  getLatestCoverLetterForJobMatch as GetCoverFn,
  createCoverLetterForUser as CreateCoverFn,
} from "@/server/data/cover-letters";

const TEST_DB_PATH = "./prisma/test-tailoring-ownership.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("row-level ownership: TailoredResume / CoverLetter / ReviewDecision", () => {
  let db: typeof DbClient;
  let getLatestTailoredResumeForJobMatch: typeof GetTailoredFn;
  let getTailoredResumeByIdForUser: typeof GetTailoredByIdFn;
  let createTailoredResumeForUser: typeof CreateTailoredFn;
  let recordReviewDecisionForUser: typeof RecordDecisionFn;
  let getLatestCoverLetterForJobMatch: typeof GetCoverFn;
  let createCoverLetterForUser: typeof CreateCoverFn;

  let userAId: string;
  let userBId: string;
  let jobMatchId: string;
  let tailoredResumeId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({
      getLatestTailoredResumeForJobMatch,
      getTailoredResumeByIdForUser,
      createTailoredResumeForUser,
      recordReviewDecisionForUser,
    } = await import("@/server/data/tailored-resumes"));
    ({ getLatestCoverLetterForJobMatch, createCoverLetterForUser } = await import(
      "@/server/data/cover-letters"
    ));

    const userA = await db.user.create({
      data: { email: "tailoring-owner-a@example.com", passwordHash: "not-a-real-hash" },
    });
    const userB = await db.user.create({
      data: { email: "tailoring-owner-b@example.com", passwordHash: "not-a-real-hash" },
    });
    userAId = userA.id;
    userBId = userB.id;

    const resume = await db.masterResume.create({
      data: {
        userId: userAId,
        originalFileName: "resume.pdf",
        originalMimeType: "application/pdf",
        originalFileData: Buffer.from("fake"),
        status: "VERIFIED",
      },
    });
    const version = await db.resumeVersion.create({
      data: {
        masterResumeId: resume.id,
        versionNumber: 1,
        snapshot: { extractedText: null, facts: [] },
      },
    });

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "src-own-1",
        sourceUrl: "https://example.com/job",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-own-1",
        createdByUserId: userAId,
      },
    });

    const jobMatch = await db.jobMatch.create({
      data: {
        userId: userAId,
        jobId: job.id,
        score: 80,
        matchedRequirements: [],
        missingRequirements: [],
        transferableSkills: [],
        hardFilterFailures: [],
        concerns: [],
        explanation: "User A's private analysis.",
      },
    });
    jobMatchId = jobMatch.id;

    const tailoredResume = await createTailoredResumeForUser(userAId, jobMatchId, {
      baseVersionId: version.id,
      recommendedChanges: [],
      initialContent: { facts: [] },
    });
    tailoredResumeId = tailoredResume!.id;

    await createCoverLetterForUser(userAId, jobMatchId, "Dear hiring manager,");
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns the tailored résumé to its owner", async () => {
    const found = await getLatestTailoredResumeForJobMatch(jobMatchId, userAId);
    expect(found?.id).toBe(tailoredResumeId);
  });

  it("does not return another user's tailored résumé by job match id", async () => {
    const found = await getLatestTailoredResumeForJobMatch(jobMatchId, userBId);
    expect(found).toBeNull();
  });

  it("does not return another user's tailored résumé by direct id lookup", async () => {
    const found = await getTailoredResumeByIdForUser(tailoredResumeId, userBId);
    expect(found).toBeNull();
  });

  it("createTailoredResumeForUser refuses to create against a job match the caller does not own", async () => {
    const result = await createTailoredResumeForUser(userBId, jobMatchId, {
      baseVersionId: "does-not-matter",
      recommendedChanges: [],
      initialContent: { facts: [] },
    });
    expect(result).toBeNull();
  });

  it("recordReviewDecisionForUser refuses to record a decision for a non-owned tailored résumé", async () => {
    const result = await recordReviewDecisionForUser(userBId, tailoredResumeId, {
      changePath: "0",
      decision: "ACCEPTED",
    });
    expect(result).toEqual({ ok: false, error: "NOT_FOUND" });
  });

  it("does not return another user's cover letter", async () => {
    const foundA = await getLatestCoverLetterForJobMatch(jobMatchId, userAId);
    const foundB = await getLatestCoverLetterForJobMatch(jobMatchId, userBId);
    expect(foundA).not.toBeNull();
    expect(foundB).toBeNull();
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  createTailoredResumeForUser as CreateTailoredFn,
  recordReviewDecisionForUser as RecordDecisionFn,
  getLatestDecisionsByChangePath as GetLatestFn,
} from "@/server/data/tailored-resumes";
import type { EnforcedChange } from "@/lib/tailoring/schemas";

const TEST_DB_PATH = "./prisma/test-review-decisions.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const okChange: EnforcedChange = {
  section: "SUMMARY",
  targetFactId: "fact-1",
  originalText: "Old",
  proposedText: "New",
  reason: "matches job",
  supportingFactIds: [],
  confidence: 0.9,
  index: 0,
  status: "OK",
  uncertain: false,
};

const droppedChange: EnforcedChange = {
  ...okChange,
  index: 1,
  status: "DROPPED_LOCKED_FACT",
};

describe("recordReviewDecisionForUser / getLatestDecisionsByChangePath", () => {
  let db: typeof DbClient;
  let createTailoredResumeForUser: typeof CreateTailoredFn;
  let recordReviewDecisionForUser: typeof RecordDecisionFn;
  let getLatestDecisionsByChangePath: typeof GetLatestFn;

  let userId: string;
  let tailoredResumeId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ createTailoredResumeForUser, recordReviewDecisionForUser, getLatestDecisionsByChangePath } =
      await import("@/server/data/tailored-resumes"));

    const user = await db.user.create({
      data: { email: "review-decisions@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;

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
    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "src-rd-1",
        sourceUrl: "https://example.com/job",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-rd-1",
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

    const tailoredResume = await createTailoredResumeForUser(userId, jobMatch.id, {
      baseVersionId: version.id,
      recommendedChanges: [okChange, droppedChange],
      initialContent: { facts: [] },
    });
    tailoredResumeId = tailoredResume!.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("is append-only: two decisions for the same changePath both persist as separate rows", async () => {
    await recordReviewDecisionForUser(userId, tailoredResumeId, {
      changePath: "0",
      decision: "REJECTED",
    });
    await recordReviewDecisionForUser(userId, tailoredResumeId, {
      changePath: "0",
      decision: "ACCEPTED",
    });

    const rows = await db.reviewDecision.findMany({ where: { tailoredResumeId, changePath: "0" } });
    expect(rows).toHaveLength(2);
  });

  it("getLatestDecisionsByChangePath returns the most recent decision, not the first", async () => {
    const map = await getLatestDecisionsByChangePath(tailoredResumeId);
    expect(map.get("0")?.decision).toBe("ACCEPTED");
  });

  it("rejects recording a decision for a change with status !== OK", async () => {
    const result = await recordReviewDecisionForUser(userId, tailoredResumeId, {
      changePath: "1",
      decision: "ACCEPTED",
    });
    expect(result).toEqual({ ok: false, error: "CHANGE_NOT_DECIDABLE" });
  });

  it("rejects recording a decision for a changePath with no matching change at all", async () => {
    const result = await recordReviewDecisionForUser(userId, tailoredResumeId, {
      changePath: "99",
      decision: "ACCEPTED",
    });
    expect(result).toEqual({ ok: false, error: "CHANGE_NOT_DECIDABLE" });
  });

  it("stores editedText for an EDITED decision", async () => {
    const result = await recordReviewDecisionForUser(userId, tailoredResumeId, {
      changePath: "0",
      decision: "EDITED",
      editedText: "My custom edit.",
    });
    expect(result.ok).toBe(true);
    const map = await getLatestDecisionsByChangePath(tailoredResumeId);
    expect(map.get("0")).toEqual({ decision: "EDITED", editedText: "My custom edit." });
  });
});

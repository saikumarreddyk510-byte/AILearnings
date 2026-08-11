import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { approveApplicationMaterials as ApproveFn } from "@/lib/tailoring/approve";
import type { createTailoredResumeForUser as CreateTailoredFn } from "@/server/data/tailored-resumes";
import type { recordReviewDecisionForUser as RecordDecisionFn } from "@/server/data/tailored-resumes";
import type { createCoverLetterForUser as CreateCoverFn } from "@/server/data/cover-letters";
import type { EnforcedChange } from "@/lib/tailoring/schemas";
import { REQUIRED_CONFIRMATION_TEXT } from "@/lib/tailoring/constants";

const TEST_DB_PATH = "./prisma/test-approve-guard.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const okChange: EnforcedChange = {
  section: "SUMMARY",
  targetFactId: "fact-1",
  originalText: "Old summary.",
  proposedText: "New summary.",
  reason: "matches job",
  supportingFactIds: [],
  confidence: 0.9,
  index: 0,
  status: "OK",
  uncertain: false,
};

describe("approveApplicationMaterials", () => {
  let db: typeof DbClient;
  let approveApplicationMaterials: typeof ApproveFn;
  let createTailoredResumeForUser: typeof CreateTailoredFn;
  let recordReviewDecisionForUser: typeof RecordDecisionFn;
  let createCoverLetterForUser: typeof CreateCoverFn;

  let userId: string;
  let jobMatchId: string;
  let versionId: string;

  async function setupJobMatch() {
    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: `src-${Date.now()}-${Math.random()}`,
        sourceUrl: "https://example.com/job",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: `fp-${Date.now()}-${Math.random()}`,
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
    return jobMatch.id;
  }

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ approveApplicationMaterials } = await import("@/lib/tailoring/approve"));
    ({ createTailoredResumeForUser, recordReviewDecisionForUser } = await import(
      "@/server/data/tailored-resumes"
    ));
    ({ createCoverLetterForUser } = await import("@/server/data/cover-letters"));

    const user = await db.user.create({
      data: { email: "approve-guard@example.com", passwordHash: "not-a-real-hash" },
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
      data: {
        masterResumeId: resume.id,
        versionNumber: 1,
        snapshot: {
          extractedText: null,
          facts: [
            {
              id: "fact-1",
              type: "SUMMARY",
              content: { text: "Old summary." },
              verified: true,
              locked: false,
              sortOrder: 0,
            },
          ],
        },
      },
    });
    versionId = version.id;

    jobMatchId = await setupJobMatch();
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("rejects an incorrect confirmation text", async () => {
    const result = await approveApplicationMaterials({
      userId,
      jobMatchId,
      confirmationText: "I approve this.",
    });
    expect(result).toEqual({ ok: false, error: "CONFIRMATION_TEXT_MISMATCH" });
  });

  it("rejects approval while a non-dropped change lacks a decision", async () => {
    await createTailoredResumeForUser(userId, jobMatchId, {
      baseVersionId: versionId,
      recommendedChanges: [okChange],
      initialContent: { facts: [] },
    });

    const result = await approveApplicationMaterials({
      userId,
      jobMatchId,
      confirmationText: REQUIRED_CONFIRMATION_TEXT,
    });
    expect(result).toEqual({ ok: false, error: "PENDING_DECISIONS" });
  });

  it("succeeds once every change is decided and the exact confirmation text is supplied, flips résumé + cover letter to APPROVED, and writes an AuditEvent", async () => {
    const localJobMatchId = await setupJobMatch();
    const tailoredResume = await createTailoredResumeForUser(userId, localJobMatchId, {
      baseVersionId: versionId,
      recommendedChanges: [okChange],
      initialContent: { facts: [] },
    });
    await recordReviewDecisionForUser(userId, tailoredResume!.id, {
      changePath: "0",
      decision: "ACCEPTED",
    });
    const coverLetter = await createCoverLetterForUser(userId, localJobMatchId, "Dear hiring manager,");

    const result = await approveApplicationMaterials({
      userId,
      jobMatchId: localJobMatchId,
      confirmationText: REQUIRED_CONFIRMATION_TEXT,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.tailoredResume.status).toBe("APPROVED");
    const content = result.tailoredResume.content as { facts: { content: { text: string } }[] };
    expect(content.facts[0].content.text).toBe("New summary.");

    const refetchedCoverLetter = await db.coverLetter.findUnique({ where: { id: coverLetter!.id } });
    expect(refetchedCoverLetter?.status).toBe("APPROVED");

    const auditEvent = await db.auditEvent.findFirst({
      where: { action: "APPLICATION_MATERIALS_APPROVED", entityId: tailoredResume!.id },
    });
    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.userId).toBe(userId);
  });

  it("rejects re-approval of an already-approved tailored résumé", async () => {
    const localJobMatchId = await setupJobMatch();
    const tailoredResume = await createTailoredResumeForUser(userId, localJobMatchId, {
      baseVersionId: versionId,
      recommendedChanges: [okChange],
      initialContent: { facts: [] },
    });
    await recordReviewDecisionForUser(userId, tailoredResume!.id, {
      changePath: "0",
      decision: "ACCEPTED",
    });

    const first = await approveApplicationMaterials({
      userId,
      jobMatchId: localJobMatchId,
      confirmationText: REQUIRED_CONFIRMATION_TEXT,
    });
    expect(first.ok).toBe(true);

    const second = await approveApplicationMaterials({
      userId,
      jobMatchId: localJobMatchId,
      confirmationText: REQUIRED_CONFIRMATION_TEXT,
    });
    expect(second).toEqual({ ok: false, error: "ALREADY_APPROVED" });
  });

  it("returns JOB_MATCH_NOT_FOUND for a nonexistent job match", async () => {
    const result = await approveApplicationMaterials({
      userId,
      jobMatchId: "does-not-exist",
      confirmationText: REQUIRED_CONFIRMATION_TEXT,
    });
    expect(result).toEqual({ ok: false, error: "JOB_MATCH_NOT_FOUND" });
  });
});

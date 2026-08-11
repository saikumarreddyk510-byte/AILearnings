import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { tailorResume as TailorFn } from "@/lib/tailoring/tailor";
import type { AIProvider } from "@/lib/ai/types";

const TEST_DB_PATH = "./prisma/test-tailor-orchestrator.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const RAW_DESCRIPTION =
  "This description mentions a super-secret candidate detail that must never leak into logs.";

function fakeProviderReturning(recommendedChanges: unknown[]): AIProvider {
  return {
    name: "fake-tailor",
    async generateStructuredOutput() {
      return { data: { recommendedChanges } as never, model: "fake-1" };
    },
  };
}

function fakeSchemaViolatingProvider(): AIProvider {
  return {
    name: "fake-evil",
    async generateStructuredOutput() {
      return { data: { recommendedChanges: "not an array" } as never, model: "evil-1" };
    },
  };
}

describe("tailorResume orchestrator", () => {
  let db: typeof DbClient;
  let tailorResume: typeof TailorFn;

  let userId: string;
  let jobMatchId: string;
  let summaryFactId: string;
  let lockedFactId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ tailorResume } = await import("@/lib/tailoring/tailor"));

    const user = await db.user.create({
      data: { email: "tailor@example.com", passwordHash: "not-a-real-hash" },
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

    const summaryFact = await db.resumeFact.create({
      data: {
        masterResumeId: resume.id,
        type: "SUMMARY",
        content: { text: "Experienced engineer." },
        verified: true,
        locked: false,
        sortOrder: 0,
      },
    });
    summaryFactId = summaryFact.id;

    const lockedFact = await db.resumeFact.create({
      data: {
        masterResumeId: resume.id,
        type: "SKILL",
        content: { name: "Python" },
        verified: true,
        locked: true,
        sortOrder: 1,
      },
    });
    lockedFactId = lockedFact.id;

    await db.resumeVersion.create({
      data: {
        masterResumeId: resume.id,
        versionNumber: 1,
        snapshot: {
          extractedText: null,
          facts: [
            {
              id: summaryFact.id,
              type: "SUMMARY",
              content: summaryFact.content,
              verified: true,
              locked: false,
              sortOrder: 0,
            },
            {
              id: lockedFact.id,
              type: "SKILL",
              content: lockedFact.content,
              verified: true,
              locked: true,
              sortOrder: 1,
            },
          ],
        },
      },
    });

    const job = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "src-1",
        sourceUrl: "https://example.com/job",
        company: "Acme",
        title: "Backend Engineer",
        description: RAW_DESCRIPTION,
        requiredSkills: ["Python", "SQL"],
        preferredSkills: [],
        contentFingerprint: "fp-1",
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
    jobMatchId = jobMatch.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("creates a SUCCEEDED AIExecution and a TailoredResume with the real mock provider", async () => {
    const result = await tailorResume({ userId, jobMatchId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.tailoredResume?.status).toBe("DRAFT");
    expect(result.tailoredResume?.recommendedChanges).toEqual([]);

    const execution = await db.aIExecution.findFirst({
      where: { userId, purpose: "RESUME_TAILORING" },
      orderBy: { createdAt: "desc" },
    });
    expect(execution?.status).toBe("SUCCEEDED");
  });

  it("never leaks the raw job description or résumé content into inputSummary", async () => {
    await tailorResume({ userId, jobMatchId });
    const execution = await db.aIExecution.findFirst({
      where: { userId, purpose: "RESUME_TAILORING" },
      orderBy: { createdAt: "desc" },
    });
    expect(execution?.inputSummary ?? "").not.toContain(RAW_DESCRIPTION);
    expect(execution?.inputSummary ?? "").not.toContain("Experienced engineer");
  });

  it("persists a change against a locked fact as DROPPED_LOCKED_FACT, never OK", async () => {
    const fake = fakeProviderReturning([
      {
        section: "SKILL",
        targetFactId: lockedFactId,
        originalText: "Python",
        proposedText: "Python (expert)",
        reason: "matches job",
        supportingFactIds: [],
        confidence: 0.9,
      },
    ]);
    const result = await tailorResume({ userId, jobMatchId }, fake);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const changes = result.tailoredResume?.recommendedChanges as { status: string }[];
    expect(changes[0].status).toBe("DROPPED_LOCKED_FACT");
  });

  it("persists a change against a nonexistent fact as DROPPED_UNSUPPORTED_TARGET", async () => {
    const fake = fakeProviderReturning([
      {
        section: "SUMMARY",
        targetFactId: "does-not-exist",
        originalText: "x",
        proposedText: "y",
        reason: "matches job",
        supportingFactIds: [],
        confidence: 0.9,
      },
    ]);
    const result = await tailorResume({ userId, jobMatchId }, fake);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const changes = result.tailoredResume?.recommendedChanges as { status: string }[];
    expect(changes[0].status).toBe("DROPPED_UNSUPPORTED_TARGET");
  });

  it("creates no TailoredResume row and records a FAILED AIExecution when AI output fails schema validation", async () => {
    const before = await db.tailoredResume.count({ where: { jobMatchId } });
    const result = await tailorResume({ userId, jobMatchId }, fakeSchemaViolatingProvider());
    expect(result).toEqual({ ok: false, error: "AI_GENERATION_FAILED" });

    const after = await db.tailoredResume.count({ where: { jobMatchId } });
    expect(after).toBe(before);

    const execution = await db.aIExecution.findFirst({
      where: { userId, purpose: "RESUME_TAILORING" },
      orderBy: { createdAt: "desc" },
    });
    expect(execution?.status).toBe("FAILED");
  });

  it("returns JOB_MATCH_NOT_FOUND for a nonexistent job match", async () => {
    const result = await tailorResume({ userId, jobMatchId: "does-not-exist" });
    expect(result).toEqual({ ok: false, error: "JOB_MATCH_NOT_FOUND" });
  });

  it("returns NO_VERIFIED_RESUME for a user with no verified résumé, even with their own job match", async () => {
    const otherUser = await db.user.create({
      data: { email: "no-resume-tailor@example.com", passwordHash: "not-a-real-hash" },
    });
    const otherJob = await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "src-2",
        sourceUrl: "https://example.com/job-2",
        company: "Acme",
        title: "Frontend Engineer",
        description: "n/a",
        contentFingerprint: "fp-2",
        createdByUserId: otherUser.id,
      },
    });
    const otherJobMatch = await db.jobMatch.create({
      data: {
        userId: otherUser.id,
        jobId: otherJob.id,
        score: 0,
        matchedRequirements: [],
        missingRequirements: [],
        transferableSkills: [],
        hardFilterFailures: [],
        concerns: [],
        explanation: "n/a",
      },
    });

    const result = await tailorResume({ userId: otherUser.id, jobMatchId: otherJobMatch.id });
    expect(result).toEqual({ ok: false, error: "NO_VERIFIED_RESUME" });
  });

  it("uses summaryFactId in setup (sanity)", () => {
    expect(summaryFactId).toBeTruthy();
  });
});

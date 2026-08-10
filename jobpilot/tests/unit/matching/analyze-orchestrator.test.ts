import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { analyzeJobMatch as AnalyzeFn } from "@/lib/matching/analyze";
import type { AIProvider } from "@/lib/ai/types";

const TEST_DB_PATH = "./prisma/test-analyze-orchestrator.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const RAW_DESCRIPTION =
  "This description mentions a super-secret candidate detail that must never leak into logs.";

function fakeSchemaViolatingProvider(): AIProvider {
  return {
    name: "fake-evil",
    async generateStructuredOutput() {
      return { data: { concerns: "not an array" } as never, model: "evil-1" };
    },
  };
}

describe("analyzeJobMatch orchestrator", () => {
  let db: typeof DbClient;
  let analyzeJobMatch: typeof AnalyzeFn;

  let userId: string;
  let jobId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ analyzeJobMatch } = await import("@/lib/matching/analyze"));

    const user = await db.user.create({
      data: { email: "analyze@example.com", passwordHash: "not-a-real-hash" },
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
    await db.resumeFact.create({
      data: {
        masterResumeId: resume.id,
        type: "SKILL",
        content: { name: "Python" },
        verified: true,
        locked: false,
        sortOrder: 0,
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
    jobId = job.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("creates a SUCCEEDED AIExecution and a cross-linked JobMatch with the real mock provider", async () => {
    const result = await analyzeJobMatch({ userId, jobId, searchProfileId: null });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.aiDegraded).toBe(false);
    expect(result.jobMatch.score).toBeGreaterThan(0);
    expect(result.jobMatch.aiExecutionId).not.toBeNull();

    const execution = await db.aIExecution.findUnique({
      where: { id: result.jobMatch.aiExecutionId! },
    });
    expect(execution?.status).toBe("SUCCEEDED");
    expect(execution?.purpose).toBe("MATCH_ANALYSIS");
  });

  it("never leaks the raw job description or résumé content into inputSummary", async () => {
    const result = await analyzeJobMatch({ userId, jobId, searchProfileId: null });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const execution = await db.aIExecution.findUnique({
      where: { id: result.jobMatch.aiExecutionId! },
    });
    expect(execution?.inputSummary ?? "").not.toContain(RAW_DESCRIPTION);
    expect(execution?.inputSummary ?? "").not.toContain("Python"); // résumé skill name
  });

  it("degrades gracefully (persists the deterministic half) when the AI output fails schema validation", async () => {
    const result = await analyzeJobMatch(
      { userId, jobId, searchProfileId: null },
      fakeSchemaViolatingProvider()
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.aiDegraded).toBe(true);
    expect(result.jobMatch.concerns).toEqual([]);
    expect(result.jobMatch.explanation).toMatch(/unaffected/i);
    // Deterministic half is still real, non-empty data.
    expect(result.jobMatch.score).toBeGreaterThan(0);

    const execution = await db.aIExecution.findUnique({
      where: { id: result.jobMatch.aiExecutionId! },
    });
    expect(execution?.status).toBe("FAILED");
  });

  it("returns NO_VERIFIED_RESUME for a user with no verified résumé", async () => {
    const otherUser = await db.user.create({
      data: { email: "no-resume@example.com", passwordHash: "not-a-real-hash" },
    });
    const result = await analyzeJobMatch({
      userId: otherUser.id,
      jobId,
      searchProfileId: null,
    });
    expect(result).toEqual({ ok: false, error: "NO_VERIFIED_RESUME" });
  });

  it("returns JOB_NOT_FOUND for a nonexistent job", async () => {
    const result = await analyzeJobMatch({
      userId,
      jobId: "does-not-exist",
      searchProfileId: null,
    });
    expect(result).toEqual({ ok: false, error: "JOB_NOT_FOUND" });
  });

  it("returns PROFILE_NOT_FOUND for a nonexistent search profile", async () => {
    const result = await analyzeJobMatch({
      userId,
      jobId,
      searchProfileId: "does-not-exist",
    });
    expect(result).toEqual({ ok: false, error: "PROFILE_NOT_FOUND" });
  });
});

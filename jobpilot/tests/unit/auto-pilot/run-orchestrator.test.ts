import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { runAutoPilot as RunAutoPilotFn } from "@/lib/auto-pilot/run";

const TEST_DB_PATH = "./prisma/test-auto-pilot-orchestrator.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("runAutoPilot orchestrator", () => {
  let db: typeof DbClient;
  let runAutoPilot: typeof RunAutoPilotFn;

  let userId: string;
  let matchingProfileId: string;
  let nonMatchingProfileId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ runAutoPilot } = await import("@/lib/auto-pilot/run"));

    const user = await db.user.create({
      data: { email: "autopilot@example.com", passwordHash: "not-a-real-hash" },
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
    await db.resumeFact.createMany({
      data: [
        {
          masterResumeId: resume.id,
          type: "SKILL",
          content: { name: "Go" },
          verified: true,
          locked: false,
          sortOrder: 0,
        },
        {
          masterResumeId: resume.id,
          type: "SUMMARY",
          content: { text: "Backend engineer with distributed-systems experience." },
          verified: true,
          locked: false,
          sortOrder: 1,
        },
      ],
    });
    // A verified résumé needs at least one saved version for tailoring's base snapshot.
    await db.resumeVersion.create({
      data: {
        masterResumeId: resume.id,
        versionNumber: 1,
        snapshot: {
          extractedText: "Backend engineer with distributed-systems experience. Go.",
          facts: [
            {
              id: "f-skill",
              type: "SKILL",
              content: { name: "Go" },
              verified: true,
              locked: false,
              sortOrder: 0,
            },
            {
              id: "f-summary",
              type: "SUMMARY",
              content: { text: "Backend engineer with distributed-systems experience." },
              verified: true,
              locked: false,
              sortOrder: 1,
            },
          ],
        },
      },
    });

    // MOCK catalog job whose sourceJobId matches a MockJobSource fixture
    // (mock-002 = "Backend Engineer, Platform"), so searchJobs resolves it.
    await db.job.create({
      data: {
        source: "MOCK",
        sourceJobId: "mock-002",
        sourceUrl: "https://example.com/jobs/mock-002",
        applicationUrl: "https://example.com/jobs/mock-002/apply",
        company: "Riverbank Data Co.",
        title: "Backend Engineer, Platform",
        description: "Design and operate distributed services in Go and PostgreSQL.",
        requiredSkills: ["Go", "PostgreSQL"],
        preferredSkills: ["Kubernetes"],
        contentFingerprint: "fp-mock-002",
        createdByUserId: null,
      },
    });

    const matching = await db.searchProfile.create({
      data: {
        userId,
        name: "Backend roles",
        targetRoleTitles: ["Backend Engineer"],
        searchFrequency: "MANUAL",
      },
    });
    matchingProfileId = matching.id;

    const nonMatching = await db.searchProfile.create({
      data: {
        userId,
        name: "Nursing roles",
        targetRoleTitles: ["Registered Nurse"],
        searchFrequency: "MANUAL",
      },
    });
    nonMatchingProfileId = nonMatching.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns NO_VERIFIED_RESUME when the user has no verified résumé", async () => {
    const other = await db.user.create({
      data: { email: "no-resume@example.com", passwordHash: "x" },
    });
    const profile = await db.searchProfile.create({
      data: {
        userId: other.id,
        name: "Anything",
        targetRoleTitles: ["Backend Engineer"],
        searchFrequency: "MANUAL",
      },
    });

    const result = await runAutoPilot({ userId: other.id, searchProfileId: profile.id });
    expect(result).toEqual({ ok: false, error: "NO_VERIFIED_RESUME" });
  });

  it("returns PROFILE_NOT_FOUND for a profile the user doesn't own", async () => {
    const result = await runAutoPilot({ userId, searchProfileId: "does-not-exist" });
    expect(result).toEqual({ ok: false, error: "PROFILE_NOT_FOUND" });
  });

  it("reports noMatches when no catalog job matches the target roles", async () => {
    const result = await runAutoPilot({ userId, searchProfileId: nonMatchingProfileId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.noMatches).toBe(true);
    expect(result.jobs).toHaveLength(0);
  });

  it("analyzes and drafts a tailored résumé for a matched job — without applying or submitting", async () => {
    const result = await runAutoPilot({ userId, searchProfileId: matchingProfileId });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.noMatches).toBe(false);
    expect(result.jobs).toHaveLength(1);

    const job = result.jobs[0];
    expect(job.title).toBe("Backend Engineer, Platform");
    expect(job.jobMatchId).not.toBeNull();
    expect(job.score).toBeGreaterThan(0);
    expect(job.reviewHref).toBe(`/review/${job.jobMatchId}`);
    expect(job.applyHref).toBe(`/applications/${job.jobId}`);
    expect(job.error).toBeNull();

    // It only prepares drafts for review — never creates an application.
    const applications = await db.application.count({ where: { userId } });
    expect(applications).toBe(0);

    // The tailored résumé it drafted is a DRAFT, never auto-approved.
    const tailored = await db.tailoredResume.findFirst({
      where: { jobMatch: { userId, jobId: job.jobId } },
    });
    expect(tailored?.status).toBe("DRAFT");
  });
});

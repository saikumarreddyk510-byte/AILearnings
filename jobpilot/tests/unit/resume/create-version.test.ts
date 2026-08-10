import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  createMasterResumeForUser as CreateResumeFn,
  createResumeVersionForUser as CreateVersionFn,
  getMasterResumeByIdForUser as GetResumeFn,
  replaceResumeFactsForUser as ReplaceFn,
} from "@/server/data/resumes";

const TEST_DB_PATH = "./prisma/test-create-version.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("createResumeVersionForUser", () => {
  let db: typeof DbClient;
  let createMasterResumeForUser: typeof CreateResumeFn;
  let createResumeVersionForUser: typeof CreateVersionFn;
  let getMasterResumeByIdForUser: typeof GetResumeFn;
  let replaceResumeFactsForUser: typeof ReplaceFn;

  let userId: string;
  let resumeId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({
      createMasterResumeForUser,
      createResumeVersionForUser,
      getMasterResumeByIdForUser,
      replaceResumeFactsForUser,
    } = await import("@/server/data/resumes"));

    const user = await db.user.create({
      data: { email: "create-version@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;

    const resume = await createMasterResumeForUser(userId, {
      originalFileName: "resume.pdf",
      originalMimeType: "application/pdf",
      originalFileData: Buffer.from("fake pdf bytes"),
    });
    resumeId = resume.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("rejects creating a version with no facts", async () => {
    const result = await createResumeVersionForUser(resumeId, userId);
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toMatch(/at least one fact/i);
  });

  it("rejects creating a version while a fact is unverified", async () => {
    await replaceResumeFactsForUser(resumeId, userId, [
      { type: "SKILL", content: { name: "Python" }, verified: false, sortOrder: 0 },
    ]);

    const result = await createResumeVersionForUser(resumeId, userId);
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.error).toMatch(/verified/i);
  });

  it("succeeds once every fact is verified, and flips status to VERIFIED", async () => {
    const facts = await db.resumeFact.findMany({ where: { masterResumeId: resumeId } });
    await replaceResumeFactsForUser(
      resumeId,
      userId,
      facts.map((f) => ({
        id: f.id,
        type: f.type as "SKILL",
        content: f.content,
        verified: true,
        sortOrder: f.sortOrder,
      }))
    );

    const result = await createResumeVersionForUser(resumeId, userId);
    expect(result?.ok).toBe(true);
    if (result?.ok) expect(result.version.versionNumber).toBe(1);

    const resume = await getMasterResumeByIdForUser(resumeId, userId);
    expect(resume?.status).toBe("VERIFIED");
  });

  it("increments the version number on a second save", async () => {
    const result = await createResumeVersionForUser(resumeId, userId);
    expect(result?.ok).toBe(true);
    if (result?.ok) expect(result.version.versionNumber).toBe(2);
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  createMasterResumeForUser as CreateFn,
  getMasterResumeByIdForUser as GetFn,
  listMasterResumesForUser as ListFn,
} from "@/server/data/resumes";

// Each integration test file gets its own DB file so parallel test-file
// workers never race on the same SQLite file. Overriding DATABASE_URL here
// (before any dynamic import of @/lib/db below) beats the default set by
// tests/setup-env.ts.
const TEST_DB_PATH = "./prisma/test-ownership.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("row-level ownership: MasterResume", () => {
  let db: typeof DbClient;
  let createMasterResumeForUser: typeof CreateFn;
  let getMasterResumeByIdForUser: typeof GetFn;
  let listMasterResumesForUser: typeof ListFn;

  let userA: { id: string };
  let userB: { id: string };
  let resumeAId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    // Import *after* the schema exists and env vars are set, so the
    // Prisma client singleton is created against the right database.
    ({ db } = await import("@/lib/db"));
    ({ createMasterResumeForUser, getMasterResumeByIdForUser, listMasterResumesForUser } =
      await import("@/server/data/resumes"));

    userA = await db.user.create({
      data: { email: "user-a@example.com", passwordHash: "not-a-real-hash" },
    });
    userB = await db.user.create({
      data: { email: "user-b@example.com", passwordHash: "not-a-real-hash" },
    });

    const resumeA = await createMasterResumeForUser(userA.id, {
      originalFileName: "resume-a.pdf",
      originalMimeType: "application/pdf",
      originalFileData: Buffer.from("fake pdf bytes"),
    });
    resumeAId = resumeA.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns a user's own résumés", async () => {
    const resumes = await listMasterResumesForUser(userA.id);
    expect(resumes).toHaveLength(1);
    expect(resumes[0].id).toBe(resumeAId);
  });

  it("never returns another user's résumés from a list query", async () => {
    const resumes = await listMasterResumesForUser(userB.id);
    expect(resumes).toHaveLength(0);
  });

  it("returns the résumé when the owner requests it by id", async () => {
    const resume = await getMasterResumeByIdForUser(resumeAId, userA.id);
    expect(resume?.id).toBe(resumeAId);
  });

  it("returns null when a non-owner requests the résumé by id", async () => {
    const resume = await getMasterResumeByIdForUser(resumeAId, userB.id);
    expect(resume).toBeNull();
  });
});

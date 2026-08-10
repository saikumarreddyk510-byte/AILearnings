import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  createMasterResumeForUser as CreateResumeFn,
  replaceResumeFactsForUser as ReplaceFn,
  setResumeFactLockedForUser as SetLockedFn,
} from "@/server/data/resumes";

const TEST_DB_PATH = "./prisma/test-locked-guard.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("replaceResumeFactsForUser: locked-fact guard", () => {
  let db: typeof DbClient;
  let createMasterResumeForUser: typeof CreateResumeFn;
  let replaceResumeFactsForUser: typeof ReplaceFn;
  let setResumeFactLockedForUser: typeof SetLockedFn;

  let userId: string;
  let resumeId: string;
  let lockedFactId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ createMasterResumeForUser, replaceResumeFactsForUser, setResumeFactLockedForUser } =
      await import("@/server/data/resumes"));

    const user = await db.user.create({
      data: { email: "locked-guard@example.com", passwordHash: "not-a-real-hash" },
    });
    userId = user.id;

    const resume = await createMasterResumeForUser(userId, {
      originalFileName: "resume.pdf",
      originalMimeType: "application/pdf",
      originalFileData: Buffer.from("fake pdf bytes"),
    });
    resumeId = resume.id;

    const fact = await db.resumeFact.create({
      data: {
        masterResumeId: resumeId,
        type: "SKILL",
        content: { name: "Python" },
        verified: false,
        locked: true,
        sortOrder: 0,
      },
    });
    lockedFactId = fact.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("ignores a payload that tries to change a locked fact's content", async () => {
    const result = await replaceResumeFactsForUser(resumeId, userId, [
      { id: lockedFactId, type: "SKILL", content: { name: "Rust" }, verified: true, sortOrder: 0 },
    ]);
    expect(result?.ok).toBe(true);

    const stored = await db.resumeFact.findUniqueOrThrow({ where: { id: lockedFactId } });
    expect(stored.content).toEqual({ name: "Python" });
    expect(stored.verified).toBe(false);
    expect(stored.locked).toBe(true);
  });

  it("never deletes a locked fact even when omitted from the payload", async () => {
    const result = await replaceResumeFactsForUser(resumeId, userId, []);
    expect(result?.ok).toBe(true);

    const stored = await db.resumeFact.findUnique({ where: { id: lockedFactId } });
    expect(stored).not.toBeNull();
  });

  it("allows edits and deletion only after the fact is explicitly unlocked", async () => {
    const unlocked = await setResumeFactLockedForUser(lockedFactId, userId, false);
    expect(unlocked?.locked).toBe(false);

    const editResult = await replaceResumeFactsForUser(resumeId, userId, [
      { id: lockedFactId, type: "SKILL", content: { name: "Rust" }, verified: true, sortOrder: 0 },
    ]);
    expect(editResult?.ok).toBe(true);
    const afterEdit = await db.resumeFact.findUniqueOrThrow({ where: { id: lockedFactId } });
    expect(afterEdit.content).toEqual({ name: "Rust" });

    const deleteResult = await replaceResumeFactsForUser(resumeId, userId, []);
    expect(deleteResult?.ok).toBe(true);
    const afterDelete = await db.resumeFact.findUnique({ where: { id: lockedFactId } });
    expect(afterDelete).toBeNull();
  });

  it("creates new facts from payload entries without an id", async () => {
    const result = await replaceResumeFactsForUser(resumeId, userId, [
      { type: "SKILL", content: { name: "TypeScript" }, verified: false, sortOrder: 0 },
    ]);
    expect(result?.ok).toBe(true);
    if (result?.ok) {
      expect(result.facts).toHaveLength(1);
      expect(result.facts?.[0].content).toEqual({ name: "TypeScript" });
    }
  });
});

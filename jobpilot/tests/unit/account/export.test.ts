import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { buildAccountExportForUser as ExportFn } from "@/server/data/account";

const TEST_DB_PATH = "./prisma/test-account-export.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

describe("buildAccountExportForUser", () => {
  let db: typeof DbClient;
  let buildAccountExportForUser: typeof ExportFn;

  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({ buildAccountExportForUser } = await import("@/server/data/account"));

    const userA = await db.user.create({
      data: { email: "export-a@example.com", passwordHash: "hash-a", name: "User A" },
    });
    const userB = await db.user.create({
      data: { email: "export-b@example.com", passwordHash: "hash-b", name: "User B" },
    });
    userAId = userA.id;
    userBId = userB.id;

    await db.userPreference.create({ data: { userId: userAId, salaryCurrency: "USD" } });

    await db.masterResume.create({
      data: {
        userId: userAId,
        originalFileName: "resume.pdf",
        originalMimeType: "application/pdf",
        originalFileData: Buffer.from("fake-pdf-bytes"),
        status: "VERIFIED",
      },
    });

    await db.searchProfile.create({
      data: { userId: userAId, name: "My search", targetRoleTitles: ["Engineer"] },
    });

    // A's own private job.
    await db.job.create({
      data: {
        source: "MANUAL_PASTE",
        sourceJobId: "export-priv-a",
        sourceUrl: "https://example.com/priv-a",
        company: "Acme",
        title: "Engineer",
        description: "n/a",
        contentFingerprint: "fp-export-priv-a",
        createdByUserId: userAId,
      },
    });

    await db.jobSourceConnection.create({
      data: { userId: userAId, sourceType: "MOCK", config: { apiKey: "super-secret-value" } },
    });

    // User B's own stuff, to prove it never leaks into A's export.
    await db.masterResume.create({
      data: {
        userId: userBId,
        originalFileName: "b-resume.pdf",
        originalMimeType: "application/pdf",
        originalFileData: Buffer.from("b-bytes"),
        status: "VERIFIED",
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("contains exactly the requesting user's own rows", async () => {
    const exportData = await buildAccountExportForUser(userAId);

    expect(exportData.user.id).toBe(userAId);
    expect(exportData.masterResumes).toHaveLength(1);
    expect(exportData.masterResumes[0].userId).toBe(userAId);
    expect(exportData.searchProfiles).toHaveLength(1);
    expect(exportData.jobsCreatedByUser).toHaveLength(1);
    expect(exportData.jobsCreatedByUser[0].createdByUserId).toBe(userAId);
  });

  it("never includes another user's data", async () => {
    const exportData = await buildAccountExportForUser(userAId);
    const resumeUserIds = exportData.masterResumes.map((r) => r.userId);
    expect(resumeUserIds).not.toContain(userBId);
  });

  it("never includes passwordHash", async () => {
    const exportData = await buildAccountExportForUser(userAId);
    expect(exportData.user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(exportData)).not.toContain("hash-a");
  });

  it("redacts jobSourceConnection.config entirely", async () => {
    const exportData = await buildAccountExportForUser(userAId);
    expect(exportData.jobSourceConnections).toHaveLength(1);
    expect(exportData.jobSourceConnections[0]).not.toHaveProperty("config");
    expect(JSON.stringify(exportData)).not.toContain("super-secret-value");
  });

  it("base64-encodes originalFileData", async () => {
    const exportData = await buildAccountExportForUser(userAId);
    const decoded = Buffer.from(exportData.masterResumes[0].originalFileData, "base64").toString();
    expect(decoded).toBe("fake-pdf-bytes");
  });
});

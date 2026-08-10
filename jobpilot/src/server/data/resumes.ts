import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ResumeStatus } from "@/lib/enums";
import {
  ResumeFactInputSchema,
  parseFactContent,
  type ResumeFactInput,
} from "@/lib/resume/fact-schemas";

/**
 * Ownership-scoped access to MasterResume/ResumeFact/ResumeVersion rows.
 *
 * This is the pattern every future server/data/* module should follow: no
 * caller outside this file ever touches `db.masterResume` (etc.) directly,
 * and every function takes an explicit `userId` (which callers must source
 * only from the authenticated session — see src/server/auth/session.ts —
 * never from client-supplied input) and bakes it into the `where` clause.
 * That's what makes "one user cannot access another user's résumé"
 * provable in a unit test instead of just a code-review hope.
 *
 * ResumeFact/ResumeVersion don't carry their own `userId`, so ownership is
 * checked transitively via their parent MasterResume before any read/write.
 */

export async function listMasterResumesForUser(userId: string) {
  return db.masterResume.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMasterResumeByIdForUser(id: string, userId: string) {
  return db.masterResume.findFirst({
    where: { id, userId },
  });
}

export async function createMasterResumeForUser(
  userId: string,
  input: {
    originalFileName: string;
    originalMimeType: string;
    originalFileData: Buffer;
  }
) {
  return db.masterResume.create({
    data: {
      userId,
      originalFileName: input.originalFileName,
      originalMimeType: input.originalMimeType,
      // Prisma 7's Bytes field wants a Uint8Array<ArrayBuffer>; Node's
      // Buffer is typed as Uint8Array<ArrayBufferLike> (it could wrap a
      // SharedArrayBuffer), so re-copy into a plain Uint8Array to satisfy
      // the stricter type.
      originalFileData: Uint8Array.from(input.originalFileData),
    },
  });
}

/** Generic ownership-checked status transition. Returns false if not found/not owned. */
export async function setResumeStatusForUser(
  id: string,
  userId: string,
  status: ResumeStatus
): Promise<boolean> {
  const result = await db.masterResume.updateMany({
    where: { id, userId },
    data: { status },
  });
  return result.count === 1;
}

/** Stores the extraction result and moves the résumé into NEEDS_REVIEW. */
export async function saveExtractionResultForUser(
  id: string,
  userId: string,
  extractedText: string
): Promise<boolean> {
  const result = await db.masterResume.updateMany({
    where: { id, userId },
    data: { extractedText, status: "NEEDS_REVIEW" satisfies ResumeStatus },
  });
  return result.count === 1;
}

/**
 * Saves user-corrected extracted text. Any content edit means the résumé
 * needs re-review, so this also drops status back to NEEDS_REVIEW (mirrors
 * the same rule in replaceResumeFactsForUser below).
 */
export async function updateExtractedTextForUser(
  id: string,
  userId: string,
  extractedText: string
): Promise<boolean> {
  const result = await db.masterResume.updateMany({
    where: { id, userId },
    data: { extractedText, status: "NEEDS_REVIEW" satisfies ResumeStatus },
  });
  return result.count === 1;
}

/**
 * The most recent MasterResume with status VERIFIED, plus its facts — safe
 * to use wholesale, since a résumé only reaches VERIFIED once every fact on
 * it has been individually confirmed (see createResumeVersionForUser
 * below). Used by the Phase 4 matching orchestrator and by the job-detail
 * page's "you need a verified résumé first" empty state.
 */
export async function getLatestVerifiedResumeForUser(userId: string) {
  const resume = await db.masterResume.findFirst({
    where: { userId, status: "VERIFIED" satisfies ResumeStatus },
    orderBy: { createdAt: "desc" },
  });
  if (!resume) return null;

  const facts = await db.resumeFact.findMany({ where: { masterResumeId: resume.id } });
  return { resume, facts };
}

export async function listResumeFactsForUser(masterResumeId: string, userId: string) {
  const resume = await getMasterResumeByIdForUser(masterResumeId, userId);
  if (!resume) return null;

  return db.resumeFact.findMany({
    where: { masterResumeId },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });
}

export async function listResumeVersionsForUser(masterResumeId: string, userId: string) {
  const resume = await getMasterResumeByIdForUser(masterResumeId, userId);
  if (!resume) return null;

  return db.resumeVersion.findMany({
    where: { masterResumeId },
    orderBy: { versionNumber: "desc" },
  });
}

/**
 * Toggles a fact's lock. This is the *only* function that changes a fact's
 * locked state — replaceResumeFactsForUser below never touches it.
 */
export async function setResumeFactLockedForUser(
  factId: string,
  userId: string,
  locked: boolean
) {
  const fact = await db.resumeFact.findUnique({
    where: { id: factId },
    include: { masterResume: { select: { userId: true } } },
  });
  if (!fact || fact.masterResume.userId !== userId) return null;

  return db.resumeFact.update({ where: { id: factId }, data: { locked } });
}

export type ReplaceResumeFactsResult =
  | { ok: true; facts: Awaited<ReturnType<typeof listResumeFactsForUser>> }
  | { ok: false; error: string };

/**
 * Bulk-replaces a résumé's facts from an editor save. Exact contract
 * (relied on by tests/unit/resume/replace-facts-locked-guard.test.ts):
 *
 * 1. Every incoming fact is Zod-validated (shape + per-type content) before
 *    anything touches the DB — one bad entry rejects the whole call.
 * 2. A fact already `locked: true` is a full no-op if the payload tries to
 *    change it — the stored row is left byte-for-byte untouched.
 * 3. A fact omitted from the payload is deleted, UNLESS it is locked (a
 *    locked fact is never implicitly deleted — it must be explicitly
 *    unlocked via setResumeFactLockedForUser first).
 * 4. Everything else upserts normally. All inside one transaction.
 *
 * This single path is reused, unmodified, by any future AI-assisted bulk
 * edit (Phase 4/5) — that's what makes `locked` durable across phases.
 */
export async function replaceResumeFactsForUser(
  masterResumeId: string,
  userId: string,
  facts: ResumeFactInput[]
): Promise<ReplaceResumeFactsResult | null> {
  const resume = await getMasterResumeByIdForUser(masterResumeId, userId);
  if (!resume) return null;

  let validated: ResumeFactInput[];
  try {
    validated = facts.map((input) => {
      const parsed = ResumeFactInputSchema.parse(input);
      parseFactContent(parsed.type, parsed.content);
      return parsed;
    });
  } catch {
    return { ok: false, error: "One or more facts have an invalid shape." };
  }

  await db.$transaction(async (tx) => {
    const existing = await tx.resumeFact.findMany({ where: { masterResumeId } });
    const existingById = new Map(existing.map((fact) => [fact.id, fact]));
    const incomingIds = new Set(
      validated.filter((f) => f.id).map((f) => f.id as string)
    );

    const toDelete = existing.filter(
      (fact) => !incomingIds.has(fact.id) && !fact.locked
    );
    if (toDelete.length > 0) {
      await tx.resumeFact.deleteMany({
        where: { id: { in: toDelete.map((fact) => fact.id) } },
      });
    }

    for (const input of validated) {
      const existingFact = input.id ? existingById.get(input.id) : undefined;
      if (existingFact?.locked) continue; // locked: full no-op

      const data = {
        type: input.type,
        content: input.content as Prisma.InputJsonValue,
        verified: input.verified,
        sortOrder: input.sortOrder,
      };

      if (existingFact) {
        await tx.resumeFact.update({ where: { id: existingFact.id }, data });
      } else {
        await tx.resumeFact.create({ data: { masterResumeId, ...data } });
      }
    }

    if (resume.status === "VERIFIED" || resume.status === "NEEDS_REVIEW") {
      await tx.masterResume.update({
        where: { id: masterResumeId },
        data: { status: "NEEDS_REVIEW" satisfies ResumeStatus },
      });
    }
  });

  return { ok: true, facts: await listResumeFactsForUser(masterResumeId, userId) };
}

export type CreateResumeVersionResult =
  | { ok: true; version: Awaited<ReturnType<typeof db.resumeVersion.create>> }
  | { ok: false; error: string };

/**
 * Snapshots the current fact set as a new ResumeVersion. Only allowed once
 * every fact is verified (spec: "mark every fact as user-verified") — this
 * is what makes verification an enforced invariant, not a UI suggestion.
 */
export async function createResumeVersionForUser(
  masterResumeId: string,
  userId: string
): Promise<CreateResumeVersionResult | null> {
  const resume = await getMasterResumeByIdForUser(masterResumeId, userId);
  if (!resume) return null;

  const facts = await db.resumeFact.findMany({ where: { masterResumeId } });
  if (facts.length === 0) {
    return { ok: false, error: "Add at least one fact before saving a version." };
  }
  const unverifiedCount = facts.filter((f) => !f.verified).length;
  if (unverifiedCount > 0) {
    return {
      ok: false,
      error: `${unverifiedCount} fact(s) still need to be marked verified before saving a version.`,
    };
  }

  const version = await db.$transaction(async (tx) => {
    const aggregate = await tx.resumeVersion.aggregate({
      where: { masterResumeId },
      _max: { versionNumber: true },
    });
    const nextVersionNumber = (aggregate._max.versionNumber ?? 0) + 1;

    const created = await tx.resumeVersion.create({
      data: {
        masterResumeId,
        versionNumber: nextVersionNumber,
        snapshot: {
          extractedText: resume.extractedText,
          facts: facts.map((f) => ({
            type: f.type,
            content: f.content,
            verified: f.verified,
            locked: f.locked,
            sortOrder: f.sortOrder,
          })),
        } as Prisma.InputJsonValue,
      },
    });

    await tx.masterResume.update({
      where: { id: masterResumeId },
      data: { status: "VERIFIED" satisfies ResumeStatus },
    });

    return created;
  });

  return { ok: true, version };
}

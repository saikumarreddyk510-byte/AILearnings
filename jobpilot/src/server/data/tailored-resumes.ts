import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { TailoredArtifactStatus } from "@/lib/enums";
import type { EnforcedChange } from "@/lib/tailoring/schemas";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";
import type { ReviewDecisionLike } from "@/lib/tailoring/assemble";

/**
 * Ownership-scoped access to TailoredResume/ReviewDecision rows.
 *
 * TailoredResume has no direct userId column — ownership is transitive via
 * jobMatchId -> JobMatch.userId, the same "check the parent" shape already
 * used for ResumeFact -> MasterResume.userId in src/server/data/resumes.ts.
 * Every function here re-derives/re-checks that chain; no caller outside
 * this file should touch db.tailoredResume/db.reviewDecision directly.
 */

export async function getLatestTailoredResumeForJobMatch(jobMatchId: string, userId: string) {
  return db.tailoredResume.findFirst({
    where: { jobMatchId, jobMatch: { userId } },
    orderBy: { versionNumber: "desc" },
    include: { baseVersion: true },
  });
}

export async function getTailoredResumeByIdForUser(id: string, userId: string) {
  return db.tailoredResume.findFirst({
    where: { id, jobMatch: { userId } },
    include: { baseVersion: true },
  });
}

export interface CreateTailoredResumeInput {
  baseVersionId: string;
  recommendedChanges: EnforcedChange[];
  /** Nothing accepted yet — never treated as authoritative until status === APPROVED. */
  initialContent: { facts: ResumeVersionSnapshotFact[] };
}

export async function createTailoredResumeForUser(
  userId: string,
  jobMatchId: string,
  input: CreateTailoredResumeInput
) {
  const jobMatch = await db.jobMatch.findFirst({ where: { id: jobMatchId, userId } });
  if (!jobMatch) return null;

  const aggregate = await db.tailoredResume.aggregate({
    where: { jobMatchId },
    _max: { versionNumber: true },
  });
  const versionNumber = (aggregate._max.versionNumber ?? 0) + 1;

  return db.tailoredResume.create({
    data: {
      jobMatchId,
      baseVersionId: input.baseVersionId,
      content: input.initialContent as unknown as Prisma.InputJsonValue,
      recommendedChanges: input.recommendedChanges as unknown as Prisma.InputJsonValue,
      status: "DRAFT" satisfies TailoredArtifactStatus,
      versionNumber,
    },
    include: { baseVersion: true },
  });
}

export type RecordReviewDecisionResult =
  | { ok: true; decision: Awaited<ReturnType<typeof db.reviewDecision.create>> }
  | { ok: false; error: "NOT_FOUND" | "CHANGE_NOT_DECIDABLE" };

/**
 * ReviewDecision is an append-only audit log by design (no unique
 * constraint on (tailoredResumeId, changePath) in the schema) — this
 * function ALWAYS inserts a new row, never updates one. "Most recent row
 * per changePath is authoritative" is the intended read pattern (see
 * getLatestDecisionsByChangePath below) — the same non-obvious contract
 * treatment as the locked-fact no-op rule in resumes.ts.
 */
export async function recordReviewDecisionForUser(
  userId: string,
  tailoredResumeId: string,
  input: { changePath: string; decision: "ACCEPTED" | "REJECTED" | "EDITED"; editedText?: string }
): Promise<RecordReviewDecisionResult> {
  const tailoredResume = await db.tailoredResume.findFirst({
    where: { id: tailoredResumeId, jobMatch: { userId } },
  });
  if (!tailoredResume) return { ok: false, error: "NOT_FOUND" };

  const changes = tailoredResume.recommendedChanges as unknown as EnforcedChange[];
  const change = changes[Number(input.changePath)];
  if (!change || change.status !== "OK") {
    return { ok: false, error: "CHANGE_NOT_DECIDABLE" };
  }

  const decision = await db.reviewDecision.create({
    data: {
      tailoredResumeId,
      changePath: input.changePath,
      decision: input.decision,
      editedText: input.editedText ?? null,
      decidedByUserId: userId,
    },
  });
  return { ok: true, decision };
}

/** All decisions for a résumé, reduced to "latest row per changePath wins". */
export async function getLatestDecisionsByChangePath(
  tailoredResumeId: string
): Promise<Map<string, ReviewDecisionLike>> {
  const rows = await db.reviewDecision.findMany({
    where: { tailoredResumeId },
    orderBy: { createdAt: "asc" },
  });
  const map = new Map<string, ReviewDecisionLike>();
  for (const row of rows) {
    map.set(row.changePath, {
      decision: row.decision as ReviewDecisionLike["decision"],
      editedText: row.editedText,
    });
  }
  return map;
}

/**
 * The status/content flip on approval. Only ever called from
 * finalizeApprovalForUser (src/server/data/approvals.ts) inside its guarded
 * transaction, itself only invoked by src/lib/tailoring/approve.ts after
 * all guards (confirmation text, pending decisions, not-already-approved)
 * have passed — never call this directly from a server action.
 */
export async function finalizeTailoredResumeApprovalForUser(
  tx: Prisma.TransactionClient,
  tailoredResumeId: string,
  content: { facts: ResumeVersionSnapshotFact[] }
) {
  return tx.tailoredResume.update({
    where: { id: tailoredResumeId },
    data: {
      status: "APPROVED" satisfies TailoredArtifactStatus,
      content: content as unknown as Prisma.InputJsonValue,
    },
  });
}

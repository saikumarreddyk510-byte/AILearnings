import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { TailoredArtifactStatus } from "@/lib/enums";

/**
 * Ownership-scoped access to CoverLetter rows. No direct userId column —
 * ownership is transitive via jobMatchId -> JobMatch.userId, same shape as
 * src/server/data/tailored-resumes.ts.
 */

export async function getLatestCoverLetterForJobMatch(jobMatchId: string, userId: string) {
  return db.coverLetter.findFirst({
    where: { jobMatchId, jobMatch: { userId } },
    orderBy: { versionNumber: "desc" },
  });
}

export async function getCoverLetterByIdForUser(id: string, userId: string) {
  return db.coverLetter.findFirst({
    where: { id, jobMatch: { userId } },
  });
}

export async function createCoverLetterForUser(
  userId: string,
  jobMatchId: string,
  content: string
) {
  const jobMatch = await db.jobMatch.findFirst({ where: { id: jobMatchId, userId } });
  if (!jobMatch) return null;

  const aggregate = await db.coverLetter.aggregate({
    where: { jobMatchId },
    _max: { versionNumber: true },
  });
  const versionNumber = (aggregate._max.versionNumber ?? 0) + 1;

  return db.coverLetter.create({
    data: {
      jobMatchId,
      content,
      status: "DRAFT" satisfies TailoredArtifactStatus,
      versionNumber,
    },
  });
}

/** In-place edit — stays DRAFT (an approved cover letter is never silently mutated). */
export async function updateCoverLetterContentForUser(
  id: string,
  userId: string,
  content: string
): Promise<boolean> {
  const result = await db.coverLetter.updateMany({
    where: { id, jobMatch: { userId }, status: "DRAFT" satisfies TailoredArtifactStatus },
    data: { content },
  });
  return result.count === 1;
}

/** Only ever called from finalizeApprovalForUser (src/server/data/approvals.ts) — see the matching comment on finalizeTailoredResumeApprovalForUser. */
export async function finalizeCoverLetterApprovalForUser(
  tx: Prisma.TransactionClient,
  coverLetterId: string
) {
  return tx.coverLetter.update({
    where: { id: coverLetterId },
    data: { status: "APPROVED" satisfies TailoredArtifactStatus },
  });
}

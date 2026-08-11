import "server-only";
import { db } from "@/lib/db";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";
import { finalizeTailoredResumeApprovalForUser } from "@/server/data/tailored-resumes";
import { finalizeCoverLetterApprovalForUser } from "@/server/data/cover-letters";

/**
 * The one atomic write of final approval (spec SECURITY: "add an audit
 * trail for approval and submission actions"). Spans TailoredResume,
 * optionally CoverLetter, and AuditEvent — kept as a single data-layer
 * function (rather than three separate ones called ad hoc) so the whole
 * flip is genuinely atomic. All ownership/guard checks (confirmation text,
 * pending decisions, not-already-approved) happen in
 * src/lib/tailoring/approve.ts BEFORE this is called — this function trusts
 * its caller and only performs the write.
 */
export async function finalizeApprovalForUser(
  userId: string,
  params: {
    tailoredResumeId: string;
    coverLetterId: string | null;
    content: { facts: ResumeVersionSnapshotFact[] };
  }
) {
  return db.$transaction(async (tx) => {
    const tailoredResume = await finalizeTailoredResumeApprovalForUser(
      tx,
      params.tailoredResumeId,
      params.content
    );

    const coverLetter = params.coverLetterId
      ? await finalizeCoverLetterApprovalForUser(tx, params.coverLetterId)
      : null;

    await tx.auditEvent.create({
      data: {
        userId,
        action: "APPLICATION_MATERIALS_APPROVED",
        entityType: "TailoredResume",
        entityId: params.tailoredResumeId,
        metadata: { coverLetterId: params.coverLetterId },
      },
    });

    return { tailoredResume, coverLetter };
  });
}

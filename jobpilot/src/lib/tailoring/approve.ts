import "server-only";
import { REQUIRED_CONFIRMATION_TEXT } from "@/lib/tailoring/constants";
import { assembleTailoredContent } from "@/lib/tailoring/assemble";
import type { EnforcedChange } from "@/lib/tailoring/schemas";
import { parseResumeVersionSnapshot } from "@/lib/resume/version-snapshot";
import { getJobMatchByIdForUser } from "@/server/data/matches";
import {
  getLatestTailoredResumeForJobMatch,
  getLatestDecisionsByChangePath,
} from "@/server/data/tailored-resumes";
import { getLatestCoverLetterForJobMatch } from "@/server/data/cover-letters";
import { finalizeApprovalForUser } from "@/server/data/approvals";

export type ApproveApplicationMaterialsError =
  | "JOB_MATCH_NOT_FOUND"
  | "NO_TAILORED_RESUME"
  | "ALREADY_APPROVED"
  | "PENDING_DECISIONS"
  | "CONFIRMATION_TEXT_MISMATCH";

export type ApproveApplicationMaterialsResult =
  | { ok: true; tailoredResume: Awaited<ReturnType<typeof finalizeApprovalForUser>>["tailoredResume"] }
  | { ok: false; error: ApproveApplicationMaterialsError };

/**
 * Final approval (spec Core Flow step 13, section G). Requires the user to
 * have supplied the exact confirmation sentence — enforced here, not just
 * rendered client-side, so a bypassed/broken client cannot approve without
 * literally sending that text. Requires every non-dropped recommended
 * change to already have a decision (nothing left silently pending).
 * Approves the cover letter (if one exists and isn't already approved)
 * alongside the résumé, on the same checkbox — see ARCHITECTURE.md for why
 * cover letters don't get their own separate approval step.
 */
export async function approveApplicationMaterials(input: {
  userId: string;
  jobMatchId: string;
  confirmationText: string;
}): Promise<ApproveApplicationMaterialsResult> {
  const { userId, jobMatchId, confirmationText } = input;

  if (confirmationText !== REQUIRED_CONFIRMATION_TEXT) {
    return { ok: false, error: "CONFIRMATION_TEXT_MISMATCH" };
  }

  const jobMatch = await getJobMatchByIdForUser(jobMatchId, userId);
  if (!jobMatch) return { ok: false, error: "JOB_MATCH_NOT_FOUND" };

  const tailoredResume = await getLatestTailoredResumeForJobMatch(jobMatchId, userId);
  if (!tailoredResume) return { ok: false, error: "NO_TAILORED_RESUME" };
  if (tailoredResume.status === "APPROVED") return { ok: false, error: "ALREADY_APPROVED" };

  const changes = tailoredResume.recommendedChanges as unknown as EnforcedChange[];
  const decisions = await getLatestDecisionsByChangePath(tailoredResume.id);
  const undecided = changes.filter(
    (c) => c.status === "OK" && !decisions.has(String(c.index))
  );
  if (undecided.length > 0) return { ok: false, error: "PENDING_DECISIONS" };

  const baseSnapshot = parseResumeVersionSnapshot(tailoredResume.baseVersion.snapshot);
  const content = assembleTailoredContent(baseSnapshot.facts, changes, decisions);

  const coverLetter = await getLatestCoverLetterForJobMatch(jobMatchId, userId);
  const coverLetterId = coverLetter && coverLetter.status !== "APPROVED" ? coverLetter.id : null;

  const result = await finalizeApprovalForUser(userId, {
    tailoredResumeId: tailoredResume.id,
    coverLetterId,
    content,
  });

  return { ok: true, tailoredResume: result.tailoredResume };
}

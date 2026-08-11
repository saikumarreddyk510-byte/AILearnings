import "server-only";
import { db } from "@/lib/db";

/**
 * Account-level data export and deletion (spec SECURITY: "Provide
 * account-data export and deletion"). Both functions gather/act across
 * many tables for a single user — kept in their own module rather than
 * bolted onto resumes.ts/jobs.ts/etc., since neither is scoped to one
 * feature area.
 */

export async function buildAccountExportForUser(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  const preference = await db.userPreference.findUnique({ where: { userId } });

  const masterResumes = await db.masterResume.findMany({
    where: { userId },
    include: { facts: true, versions: true },
  });
  const masterResumesForExport = masterResumes.map((resume) => ({
    ...resume,
    // Full portability of what the user uploaded, base64-encoded so it
    // survives JSON serialization. Bounded by RESUME_MAX_UPLOAD_BYTES
    // (default 5MB), so the export stays a reasonable size.
    originalFileData: Buffer.from(resume.originalFileData).toString("base64"),
  }));

  const searchProfiles = await db.searchProfile.findMany({ where: { userId } });

  // Only their OWN private jobs — shared/mock jobs are never "their data".
  const jobsCreatedByUser = await db.job.findMany({ where: { createdByUserId: userId } });

  const jobMatches = await db.jobMatch.findMany({
    where: { userId },
    include: {
      job: { select: { id: true, source: true, company: true, title: true } },
      aiExecution: true,
    },
  });
  const jobMatchIds = jobMatches.map((m) => m.id);

  const tailoredResumes = await db.tailoredResume.findMany({
    where: { jobMatchId: { in: jobMatchIds } },
  });
  const tailoredResumeIds = tailoredResumes.map((t) => t.id);
  const reviewDecisions = await db.reviewDecision.findMany({
    where: { tailoredResumeId: { in: tailoredResumeIds } },
  });
  const coverLetters = await db.coverLetter.findMany({
    where: { jobMatchId: { in: jobMatchIds } },
  });

  const applications = await db.application.findMany({
    where: { userId },
    include: { job: { select: { id: true, source: true, company: true, title: true } } },
  });
  const applicationIds = applications.map((a) => a.id);
  const applicationEvents = await db.applicationEvent.findMany({
    where: { applicationId: { in: applicationIds } },
  });

  // Redacted: sourceType/status/lastSyncedAt only, `config` omitted
  // entirely even though it's the user's own data — a downloaded JSON file
  // sitting in a Downloads folder is a materially bigger exfiltration
  // surface than a live DB row. Deliberately stricter than required.
  const jobSourceConnectionsRaw = await db.jobSourceConnection.findMany({ where: { userId } });
  const jobSourceConnections = jobSourceConnectionsRaw.map((c) => ({
    id: c.id,
    sourceType: c.sourceType,
    status: c.status,
    lastSyncedAt: c.lastSyncedAt,
  }));

  // Already safe as-is — inputSummary has been redacted-by-construction
  // (counts/ids only, never raw résumé/job text) since Phase 4/5.
  const aiExecutions = await db.aIExecution.findMany({ where: { userId } });

  return {
    exportedAt: new Date().toISOString(),
    user,
    preference,
    masterResumes: masterResumesForExport,
    searchProfiles,
    jobsCreatedByUser,
    jobMatches,
    tailoredResumes,
    reviewDecisions,
    coverLetters,
    applications,
    applicationEvents,
    jobSourceConnections,
    aiExecutions,
  };
}

/** Not spec-required (that bullet only names approval/submission actions), but cheap and consistent with the existing AuditEvent pattern. */
export async function recordAccountDataExportedForUser(userId: string): Promise<void> {
  await db.auditEvent.create({
    data: { userId, action: "ACCOUNT_DATA_EXPORTED", entityType: "User", entityId: userId },
  });
}

/**
 * Irreversible. `src/server/actions/account.ts` requires a fresh password
 * confirmation before ever calling this — this function trusts its caller
 * and only performs the write.
 *
 * Deletion order matters: `Job.createdByUserId` uses `onDelete: SetNull`
 * (correct in general — a shared JobMatch/Application referencing the job
 * shouldn't vanish just because its creator did). But per
 * src/server/data/jobs.ts's visibility rule (`createdByUserId IS NULL OR
 * createdByUserId = userId`), a null owner means shared/visible to
 * everyone — so a naive `db.user.delete()` would silently promote a
 * deleted user's PRIVATE pasted job descriptions into public ones. Private
 * jobs are hard-deleted first, before the cascading user delete, to
 * prevent that leak. (They can only ever be referenced by this user's own
 * JobMatch/Application rows anyway, per that same visibility rule — never
 * another user's — so this can never destroy someone else's data.)
 */
export async function deleteAccountForUser(userId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    // Written while the User row (and its FK) still exists; AuditEvent's
    // onDelete: SetNull then nulls it out below — correct, the audit trail
    // must survive the account it describes.
    await tx.auditEvent.create({
      data: { userId, action: "ACCOUNT_DELETED", entityType: "User", entityId: userId },
    });

    await tx.job.deleteMany({ where: { createdByUserId: userId } });

    await tx.user.delete({ where: { id: userId } });
  });
}

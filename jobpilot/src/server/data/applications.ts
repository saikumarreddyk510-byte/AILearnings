import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ApplicationStatus, TrackedOutcomeStatus } from "@/lib/enums";
import { getJobByIdVisibleToUser } from "@/server/data/jobs";
import { getLatestJobMatchForUser } from "@/server/data/matches";
import { getLatestTailoredResumeForJobMatch } from "@/server/data/tailored-resumes";
import { getLatestCoverLetterForJobMatch } from "@/server/data/cover-letters";

/**
 * Ownership-scoped access to Application/ApplicationEvent rows. Unlike
 * TailoredResume/CoverLetter, Application DOES carry its own `userId`
 * column, so ownership here is direct, not transitive.
 */

export type GetOrCreateApplicationError =
  | "JOB_NOT_FOUND"
  | "NO_JOB_MATCH"
  | "NO_APPROVED_TAILORED_RESUME";

export type GetOrCreateApplicationResult =
  | { ok: true; application: Awaited<ReturnType<typeof db.application.upsert>>; created: boolean }
  | { ok: false; error: GetOrCreateApplicationError };

/**
 * The human-approval gate (spec: "no application can be submitted before
 * human approval"). Runs exactly once, here, at row creation — never
 * re-checked on read (see ARCHITECTURE.md's Phase 6 section for why
 * re-checking on every read would be a footgun, not a stronger guarantee).
 * Requires the job's latest JobMatch's latest TailoredResume to be
 * APPROVED; a CoverLetter is never required (spec: "optional cover
 * letter").
 */
export async function getOrCreateApplicationForUser(
  userId: string,
  jobId: string
): Promise<GetOrCreateApplicationResult> {
  const job = await getJobByIdVisibleToUser(jobId, userId);
  if (!job) return { ok: false, error: "JOB_NOT_FOUND" };

  const jobMatch = await getLatestJobMatchForUser(jobId, userId);
  if (!jobMatch) return { ok: false, error: "NO_JOB_MATCH" };

  const tailoredResume = await getLatestTailoredResumeForJobMatch(jobMatch.id, userId);
  if (!tailoredResume || tailoredResume.status !== "APPROVED") {
    return { ok: false, error: "NO_APPROVED_TAILORED_RESUME" };
  }

  const coverLetter = await getLatestCoverLetterForJobMatch(jobMatch.id, userId);

  const existing = await db.application.findUnique({
    where: { userId_jobId: { userId, jobId } },
  });

  // The empty `update: {}` is deliberate: revisiting this function never
  // touches an existing row's status/dateApplied/notes/etc. — only the
  // initial `create` sets the tailored-materials linkage and the frozen
  // match-score snapshot.
  const application = await db.application.upsert({
    where: { userId_jobId: { userId, jobId } },
    update: {},
    create: {
      userId,
      jobId,
      tailoredResumeId: tailoredResume.id,
      coverLetterId: coverLetter?.id ?? null,
      status: "READY_TO_APPLY" satisfies ApplicationStatus,
      matchScoreSnapshot: jobMatch.score,
    },
  });

  return { ok: true, application, created: !existing };
}

export async function getApplicationByJobIdForUser(jobId: string, userId: string) {
  return db.application.findFirst({
    where: { jobId, userId },
    include: { job: true, tailoredResume: true, coverLetter: true },
  });
}

export async function getApplicationByIdForUser(id: string, userId: string) {
  return db.application.findFirst({
    where: { id, userId },
    include: { job: true, tailoredResume: true, coverLetter: true },
  });
}

export async function listApplicationsForUser(userId: string) {
  return db.application.findMany({
    where: { userId },
    include: { job: true, tailoredResume: true, coverLetter: true },
    orderBy: { updatedAt: "desc" },
  });
}

export type ConfirmApplicationSubmissionResult =
  | { ok: true; application: Awaited<ReturnType<typeof db.application.findUniqueOrThrow>> }
  | { ok: false; error: "ALREADY_SUBMITTED"; application: NonNullable<Awaited<ReturnType<typeof db.application.findFirst>>> }
  | { ok: false; error: "NOT_FOUND" };

/**
 * The one, single implementation of "READY_TO_APPLY -> APPLIED only via an
 * explicit user action" (spec's one hard rule). The conditional
 * `updateMany` is what makes a double-click (or a race between two rapid
 * calls) safe: a second call matches zero rows and returns a
 * non-destructive ALREADY_SUBMITTED result instead of erroring or writing
 * a second ApplicationEvent — see tests/unit/applications/confirm-submission.test.ts.
 */
export async function confirmApplicationSubmissionForUser(
  id: string,
  userId: string,
  dateApplied: Date
): Promise<ConfirmApplicationSubmissionResult> {
  return db.$transaction(async (tx) => {
    const result = await tx.application.updateMany({
      where: { id, userId, status: "READY_TO_APPLY" satisfies ApplicationStatus },
      data: {
        status: "APPLIED" satisfies ApplicationStatus,
        dateApplied,
        submissionConfirmedAt: new Date(),
      },
    });

    if (result.count === 1) {
      await tx.applicationEvent.create({
        data: {
          applicationId: id,
          fromStatus: "READY_TO_APPLY" satisfies ApplicationStatus,
          toStatus: "APPLIED" satisfies ApplicationStatus,
        },
      });
      return { ok: true, application: await tx.application.findUniqueOrThrow({ where: { id } }) };
    }

    const existing = await tx.application.findFirst({ where: { id, userId } });
    if (!existing) return { ok: false, error: "NOT_FOUND" };
    return { ok: false, error: "ALREADY_SUBMITTED", application: existing };
  });
}

const APPLIED_OR_LATER = new Set<ApplicationStatus>(["APPLIED", "REJECTED", "INTERVIEW", "OFFER", "WITHDRAWN"]);

export type RecordApplicationOutcomeResult =
  | { ok: true; application: Awaited<ReturnType<typeof db.application.findUniqueOrThrow>> }
  | { ok: false; error: "NOT_FOUND" | "NOT_YET_APPLIED" | "CONCURRENT_UPDATE" };

/**
 * Free-form post-APPLIED tracker transitions (REJECTED/INTERVIEW/OFFER/
 * WITHDRAWN) — real-world outcomes the user reports, never a rigid
 * pipeline. Deliberately narrower than confirmApplicationSubmissionForUser:
 * can never be reached from before APPLIED (so you can't skip the
 * confirmed-submission step by jumping straight to OFFER), and its input
 * type structurally excludes APPLIED/READY_TO_APPLY/SUBMISSION_CONFIRMED.
 */
export async function recordApplicationOutcomeForUser(
  id: string,
  userId: string,
  toStatus: TrackedOutcomeStatus,
  message?: string
): Promise<RecordApplicationOutcomeResult> {
  return db.$transaction(async (tx) => {
    const current = await tx.application.findFirst({ where: { id, userId } });
    if (!current) return { ok: false, error: "NOT_FOUND" };
    if (!APPLIED_OR_LATER.has(current.status as ApplicationStatus)) {
      return { ok: false, error: "NOT_YET_APPLIED" };
    }

    const result = await tx.application.updateMany({
      where: { id, userId, status: current.status },
      data: { status: toStatus },
    });
    if (result.count !== 1) return { ok: false, error: "CONCURRENT_UPDATE" };

    await tx.applicationEvent.create({
      data: { applicationId: id, fromStatus: current.status, toStatus, message },
    });

    return { ok: true, application: await tx.application.findUniqueOrThrow({ where: { id } }) };
  });
}

export interface UpdateApplicationDetailsInput {
  notes?: string;
  followUpDate?: Date | null;
  contactInfo?: Record<string, unknown>;
  interviewDates?: unknown[];
}

/** Annotation-only edit — never touches status, never writes an ApplicationEvent. */
export async function updateApplicationDetailsForUser(
  id: string,
  userId: string,
  input: UpdateApplicationDetailsInput
): Promise<boolean> {
  const result = await db.application.updateMany({
    where: { id, userId },
    data: {
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.followUpDate !== undefined && { followUpDate: input.followUpDate }),
      ...(input.contactInfo !== undefined && {
        contactInfo: input.contactInfo as Prisma.InputJsonValue,
      }),
      ...(input.interviewDates !== undefined && {
        interviewDates: input.interviewDates as unknown as Prisma.InputJsonValue,
      }),
    },
  });
  return result.count === 1;
}

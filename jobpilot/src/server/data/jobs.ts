import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { JobSourceType } from "@/lib/enums";
import type { NormalizedJobFields } from "@/lib/jobs/normalize";

/**
 * Job is a *shared* catalog with an *optional* owner (spec: mock/API jobs
 * are global; manually pasted/imported jobs are private to their creator —
 * see prisma/schema.prisma's Job.createdByUserId comment). Every read here
 * applies this visibility rule instead of a strict single-owner match:
 * `createdByUserId IS NULL OR createdByUserId = :userId`.
 *
 * Mutation invariant (no edit/delete UI ships this phase, but future
 * phases must respect this): only a job's creator may ever mutate it.
 * Shared (createdByUserId: null) jobs aren't user-editable at all.
 */
function visibleToUserWhere(userId: string): Prisma.JobWhereInput {
  return { OR: [{ createdByUserId: null }, { createdByUserId: userId }] };
}

export async function listJobsVisibleToUser(userId: string) {
  return db.job.findMany({
    where: visibleToUserWhere(userId),
    orderBy: { dateDiscovered: "desc" },
  });
}

export async function getJobByIdVisibleToUser(id: string, userId: string) {
  return db.job.findFirst({
    where: { id, ...visibleToUserWhere(userId) },
  });
}

async function findVisibleJobByFingerprint(fingerprint: string, userId: string) {
  return db.job.findFirst({
    where: { contentFingerprint: fingerprint, ...visibleToUserWhere(userId) },
  });
}

export async function getJobRequirementsForJob(jobId: string, userId: string) {
  const job = await getJobByIdVisibleToUser(jobId, userId);
  if (!job) return null;
  return db.jobRequirement.findMany({ where: { jobId } });
}

type ManualIngestSource = Extract<
  JobSourceType,
  "MANUAL_URL" | "MANUAL_PASTE" | "CSV_IMPORT"
>;

export type CreateManualJobResult =
  | { ok: true; job: Awaited<ReturnType<typeof db.job.create>>; duplicate: boolean };

/**
 * Dedup is privacy-scoped (spec compliance: never let a fingerprint match
 * against another user's *private* job leak that job's existence) — the
 * pre-insert check only considers jobs already visible to this user.
 */
export async function createManualJobForUser(
  userId: string,
  normalized: NormalizedJobFields,
  source: ManualIngestSource
): Promise<CreateManualJobResult> {
  const existing = await findVisibleJobByFingerprint(
    normalized.contentFingerprint,
    userId
  );
  if (existing) {
    return { ok: true, job: existing, duplicate: true };
  }

  const job = await db.job.create({
    data: {
      source,
      sourceJobId: randomUUID(),
      sourceUrl: normalized.sourceUrl,
      applicationUrl: normalized.applicationUrl,
      company: normalized.company,
      title: normalized.title,
      description: normalized.description,
      location: normalized.location,
      workplaceType: normalized.workplaceType,
      employmentType: normalized.employmentType,
      salaryMin: normalized.salaryMin,
      salaryMax: normalized.salaryMax,
      requiredSkills: normalized.requiredSkills as Prisma.InputJsonValue | undefined,
      preferredSkills: normalized.preferredSkills as Prisma.InputJsonValue | undefined,
      datePosted: normalized.datePosted,
      contentFingerprint: normalized.contentFingerprint,
      createdByUserId: userId,
    },
  });

  return { ok: true, job, duplicate: false };
}

export interface CsvImportSummary {
  created: number;
  duplicates: number;
  failed: { row: number; message: string }[];
}

/**
 * Per-row dedup-or-create, each individually try/caught — one bad row
 * (e.g. a transient DB error) must never abort the rest of the batch.
 * Row-level *validation* failures are handled earlier, in
 * src/lib/jobs/csv.ts, before rows ever reach here.
 */
export async function createJobsFromCsvForUser(
  userId: string,
  normalizedRows: { row: number; normalized: NormalizedJobFields }[]
): Promise<CsvImportSummary> {
  let created = 0;
  let duplicates = 0;
  const failed: { row: number; message: string }[] = [];

  for (const { row, normalized } of normalizedRows) {
    try {
      const result = await createManualJobForUser(userId, normalized, "CSV_IMPORT");
      if (result.duplicate) duplicates += 1;
      else created += 1;
    } catch (error) {
      failed.push({
        row,
        message: error instanceof Error ? error.message : "Failed to import this row.",
      });
    }
  }

  return { created, duplicates, failed };
}

import "server-only";
import { MockJobSource } from "@/lib/job-sources/mock";
import { getJobSource } from "@/lib/job-sources/registry";
import { analyzeJobMatch } from "@/lib/matching/analyze";
import { tailorResume } from "@/lib/tailoring/tailor";
import { getLatestVerifiedResumeForUser } from "@/server/data/resumes";
import { getSearchProfileByIdForUser } from "@/server/data/search-profiles";
import { listJobsVisibleToUser } from "@/server/data/jobs";
import type { EnforcedChange } from "@/lib/tailoring/schemas";

/**
 * Auto-Pilot: chains the existing (compliant) building blocks into one
 * pass — search a permitted source for the profile's target roles, then for
 * each matched job run the deterministic+AI match analysis and generate a
 * tailored résumé draft. It deliberately STOPS at the human-approval gate:
 * it never approves, never starts an application, and never submits.
 *
 * Compliance (ARCHITECTURE.md): no LinkedIn scraping (MOCK / approved
 * sources only), and "the system must never automatically submit an
 * application without explicit human approval." Everything here produces
 * *drafts for review* — the user still approves and applies per job.
 */

/** Hard cap on jobs processed per run — bounds AI calls (spec: spending limits). */
export const AUTO_PILOT_MAX_JOBS = 5;

export type AutoPilotError = "NO_VERIFIED_RESUME" | "PROFILE_NOT_FOUND" | "SOURCE_UNAVAILABLE";

/** One job's outcome — serializable DTO safe to return from a server action. */
export interface AutoPilotJobResult {
  jobId: string;
  jobMatchId: string | null;
  company: string;
  title: string;
  /** Deterministic match score 0-100 ("matching percentage to the JD"). */
  score: number | null;
  matchedRequirements: string[];
  missingRequirements: string[];
  hardFilterFailures: string[];
  /** Count of applicable (status OK) tailoring changes = "what was updated". */
  appliedChangeCount: number;
  /** The proposed rewrites the user will review = "what changed". */
  proposedChanges: { section: string; proposedText: string }[];
  /** Where the human continues: review → approve → apply. */
  reviewHref: string | null;
  applyHref: string;
  /** Per-job failure that didn't abort the whole run. */
  error: string | null;
}

export interface AutoPilotRunResult {
  ok: true;
  profileName: string;
  targetRoleTitles: string[];
  jobs: AutoPilotJobResult[];
  /** True when the source returned nothing for these roles. */
  noMatches: boolean;
}

export type AutoPilotResult = AutoPilotRunResult | { ok: false; error: AutoPilotError };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export async function runAutoPilot(input: {
  userId: string;
  searchProfileId: string;
}): Promise<AutoPilotResult> {
  const { userId, searchProfileId } = input;

  // 1. A verified résumé is the non-negotiable input (same gate as manual analyze/tailor).
  const verified = await getLatestVerifiedResumeForUser(userId);
  if (!verified) return { ok: false, error: "NO_VERIFIED_RESUME" };

  // 2. The profile supplies the target roles to search for.
  const profile = await getSearchProfileByIdForUser(searchProfileId, userId);
  if (!profile) return { ok: false, error: "PROFILE_NOT_FOUND" };

  const targetRoleTitles = [
    ...asStringArray(profile.targetRoleTitles),
    ...asStringArray(profile.alternateRoleTitles),
  ];

  // 3. Search a PERMITTED source (MOCK here). A real approved job API would
  //    register under a different source type and swap in transparently.
  const source = getJobSource("MOCK") ?? new MockJobSource();
  const searchResults = await source.searchJobs({ roleTitles: targetRoleTitles });
  const wantedKeys = new Set(searchResults.map((r) => `${source.sourceType}:${r.sourceJobId}`));

  // 4. Resolve search hits to the persisted catalog rows (real jobIds needed
  //    by analyze/tailor). The MOCK catalog is seeded, so hits already exist.
  const visibleJobs = await listJobsVisibleToUser(userId);
  const matchedJobs = visibleJobs
    .filter((job) => wantedKeys.has(`${job.source}:${job.sourceJobId}`))
    .slice(0, AUTO_PILOT_MAX_JOBS);

  if (matchedJobs.length === 0) {
    return {
      ok: true,
      profileName: profile.name,
      targetRoleTitles,
      jobs: [],
      noMatches: true,
    };
  }

  // 5. Analyze + tailor each job. A failure on one job is captured per-row,
  //    never aborts the batch.
  const jobs: AutoPilotJobResult[] = [];
  for (const job of matchedJobs) {
    const applyHref = `/applications/${job.id}`;
    const analysis = await analyzeJobMatch({ userId, jobId: job.id, searchProfileId });

    if (!analysis.ok) {
      jobs.push({
        jobId: job.id,
        jobMatchId: null,
        company: job.company,
        title: job.title,
        score: null,
        matchedRequirements: [],
        missingRequirements: [],
        hardFilterFailures: [],
        appliedChangeCount: 0,
        proposedChanges: [],
        reviewHref: null,
        applyHref,
        error: `Analysis failed (${analysis.error}).`,
      });
      continue;
    }

    const jobMatch = analysis.jobMatch;
    const reviewHref = `/review/${jobMatch.id}`;
    const base: Omit<AutoPilotJobResult, "appliedChangeCount" | "proposedChanges" | "error"> = {
      jobId: job.id,
      jobMatchId: jobMatch.id,
      company: job.company,
      title: job.title,
      score: jobMatch.score,
      matchedRequirements: jobMatch.matchedRequirements as string[],
      missingRequirements: jobMatch.missingRequirements as string[],
      hardFilterFailures: jobMatch.hardFilterFailures as string[],
      reviewHref,
      applyHref,
    };

    const tailored = await tailorResume({ userId, jobMatchId: jobMatch.id });
    if (!tailored.ok || !tailored.tailoredResume) {
      jobs.push({
        ...base,
        appliedChangeCount: 0,
        proposedChanges: [],
        error: `Tailoring failed${
          tailored.ok ? "" : ` (${tailored.error})`
        } — analysis is still available for review.`,
      });
      continue;
    }

    const changes = (tailored.tailoredResume.recommendedChanges as EnforcedChange[]) ?? [];
    const applicable = changes.filter((c) => c.status === "OK");
    jobs.push({
      ...base,
      appliedChangeCount: applicable.length,
      proposedChanges: applicable.map((c) => ({ section: c.section, proposedText: c.proposedText })),
      error: null,
    });
  }

  return {
    ok: true,
    profileName: profile.name,
    targetRoleTitles,
    jobs,
    noMatches: false,
  };
}

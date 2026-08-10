import type { Job } from "@/generated/prisma/client";
import { toStringArray } from "@/lib/matching/json-utils";
import { clampMatchScore } from "@/lib/utils";

/** Structurally minimal — accepts a real ResumeFact row or a plain test fixture. */
export interface ResumeFactLike {
  type: string;
  content: unknown;
}

export interface ComputeMatchScoreInput {
  job: Pick<Job, "title" | "requiredSkills" | "preferredSkills" | "description">;
  resumeFacts: ResumeFactLike[];
}

export interface ComputeMatchScoreResult {
  score: number;
  matchedRequirements: string[];
  missingRequirements: string[];
  transferableSkills: string[];
}

function getResumeSkillNames(resumeFacts: ResumeFactLike[]): string[] {
  return resumeFacts
    .filter((f) => f.type === "SKILL")
    .map((f) => {
      const content = f.content as { name?: unknown };
      return typeof content?.name === "string" ? content.name : "";
    })
    .filter(Boolean);
}

function getWorkHistoryTitles(resumeFacts: ResumeFactLike[]): string[] {
  return resumeFacts
    .filter((f) => f.type === "WORK_HISTORY")
    .map((f) => {
      const content = f.content as { title?: unknown };
      return typeof content?.title === "string" ? content.title : "";
    })
    .filter(Boolean);
}

/**
 * Deterministic 0-100 match score plus the matched/missing/transferable
 * skill lists it's derived from. Pure — no I/O, no AI call — which is what
 * makes it both fully explainable ("transparent score," spec section E)
 * and structurally immune to prompt injection embedded in
 * `job.description` (see tests/unit/matching/prompt-injection.test.ts):
 * the description's raw text only ever feeds a case-insensitive substring
 * check for `transferableSkills`, never anything interpreted as
 * instructions.
 */
export function computeMatchScore(input: ComputeMatchScoreInput): ComputeMatchScoreResult {
  const { job, resumeFacts } = input;

  const resumeSkills = getResumeSkillNames(resumeFacts);
  const resumeSkillSet = new Set(resumeSkills.map((s) => s.toLowerCase()));

  const requiredSkills = toStringArray(job.requiredSkills);
  const preferredSkills = toStringArray(job.preferredSkills);

  const matchedRequired = requiredSkills.filter((s) => resumeSkillSet.has(s.toLowerCase()));
  const missingRequired = requiredSkills.filter((s) => !resumeSkillSet.has(s.toLowerCase()));
  const matchedPreferred = preferredSkills.filter((s) => resumeSkillSet.has(s.toLowerCase()));

  const matchedRequirements = [
    ...matchedRequired.map((s) => `${s} (required)`),
    ...matchedPreferred.map((s) => `${s} (preferred)`),
  ];
  const missingRequirements = missingRequired;

  const structuredSkillSet = new Set(
    [...requiredSkills, ...preferredSkills].map((s) => s.toLowerCase())
  );
  const descriptionLower = job.description.toLowerCase();
  const transferableSkills = resumeSkills.filter((skill) => {
    const lower = skill.toLowerCase();
    return !structuredSkillSet.has(lower) && descriptionLower.includes(lower);
  });

  // Fail-open ratios: a job that lists zero skills of a given kind can't
  // penalize the candidate for "missing" skills nobody asked for — the
  // ratio defaults to full credit (1) in that case. Intentional, not a
  // bug (see the "empty skill list" test case) — matches the same
  // philosophy as src/lib/matching/filters.ts.
  const requiredRatio =
    requiredSkills.length === 0 ? 1 : matchedRequired.length / requiredSkills.length;
  const preferredRatio =
    preferredSkills.length === 0 ? 1 : matchedPreferred.length / preferredSkills.length;

  const workHistoryTitles = getWorkHistoryTitles(resumeFacts).map((t) => t.toLowerCase());
  const jobTitleLower = job.title.toLowerCase();
  let roleTitleRatio = 0;
  if (workHistoryTitles.includes(jobTitleLower)) {
    roleTitleRatio = 1;
  } else {
    const jobTitleTokens = jobTitleLower.split(/\W+/).filter((t) => t.length >= 3);
    const hasTokenOverlap = workHistoryTitles.some((title) => {
      const titleTokens = title.split(/\W+/).filter((t) => t.length >= 3);
      return jobTitleTokens.some((token) => titleTokens.includes(token));
    });
    if (hasTokenOverlap) roleTitleRatio = 0.5;
  }

  const score = clampMatchScore(60 * requiredRatio + 25 * preferredRatio + 15 * roleTitleRatio);

  return { score, matchedRequirements, missingRequirements, transferableSkills };
}

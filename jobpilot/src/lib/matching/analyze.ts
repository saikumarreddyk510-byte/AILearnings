import "server-only";
import { getAIProvider } from "@/lib/ai/config";
import { generateValidatedOutput } from "@/lib/ai/generate";
import type { AIProvider } from "@/lib/ai/types";
import { applyHardFilters } from "@/lib/matching/filters";
import { computeMatchScore } from "@/lib/matching/score";
import {
  MATCH_ANALYSIS_PROMPT_VERSION,
  MatchAnalysisSchema,
  buildMatchAnalysisPrompt,
} from "@/lib/matching/prompt";
import { getJobByIdVisibleToUser } from "@/server/data/jobs";
import { getLatestVerifiedResumeForUser } from "@/server/data/resumes";
import { getSearchProfileByIdForUser } from "@/server/data/search-profiles";
import { createJobMatchForUser } from "@/server/data/matches";
import { recordAIExecutionForUser } from "@/server/data/ai-executions";

export type AnalyzeJobMatchError = "NO_VERIFIED_RESUME" | "JOB_NOT_FOUND" | "PROFILE_NOT_FOUND";

export type AnalyzeJobMatchResult =
  | { ok: true; jobMatch: Awaited<ReturnType<typeof createJobMatchForUser>>; aiDegraded: boolean }
  | { ok: false; error: AnalyzeJobMatchError };

const FALLBACK_EXPLANATION =
  "AI narrative generation failed this run — the score and skill comparison above are unaffected, since they never depend on the AI call.";

/**
 * The full "analyze this job" flow (spec Core Flow steps 8-9). Sequence:
 * verified résumé → visible job → optional profile → deterministic hard
 * filters + score/skill-lists → AI narrative call (schema-validated,
 * prompt-injection-defended) → persist. See ARCHITECTURE.md's "Job
 * matching" section for why the score itself is deterministic, not
 * AI-produced.
 */
export async function analyzeJobMatch(
  input: {
    userId: string;
    jobId: string;
    searchProfileId: string | null;
  },
  /** Injectable for tests (e.g. a fake provider proving schema-rejection handling); defaults to the configured provider. */
  provider: AIProvider = getAIProvider()
): Promise<AnalyzeJobMatchResult> {
  const { userId, jobId, searchProfileId } = input;

  const verified = await getLatestVerifiedResumeForUser(userId);
  if (!verified) return { ok: false, error: "NO_VERIFIED_RESUME" };

  const job = await getJobByIdVisibleToUser(jobId, userId);
  if (!job) return { ok: false, error: "JOB_NOT_FOUND" };

  const profile = searchProfileId
    ? await getSearchProfileByIdForUser(searchProfileId, userId)
    : null;
  if (searchProfileId && !profile) return { ok: false, error: "PROFILE_NOT_FOUND" };

  const { failures: hardFilterFailures } = applyHardFilters(job, profile);
  const deterministic = computeMatchScore({ job, resumeFacts: verified.facts });

  const { systemPrompt, userPrompt } = buildMatchAnalysisPrompt({
    job,
    deterministic,
    hardFilterFailures,
  });

  // Redacted on purpose: counts/ids only, never raw job.description or
  // résumé fact content (spec: "Redact unnecessary personal information
  // from logs").
  const inputSummary = `job=${job.id} resume=${verified.resume.id} requiredSkills=${deterministic.matchedRequirements.length + deterministic.missingRequirements.length} matched=${deterministic.matchedRequirements.length} missing=${deterministic.missingRequirements.length} hardFilterFailures=${hardFilterFailures.length}`;

  try {
    const result = await generateValidatedOutput(provider, {
      systemPrompt,
      userPrompt,
      schema: MatchAnalysisSchema,
      metadata: { purpose: "MATCH_ANALYSIS", promptVersion: MATCH_ANALYSIS_PROMPT_VERSION },
    });

    const aiExecution = await recordAIExecutionForUser(userId, {
      purpose: "MATCH_ANALYSIS",
      provider: provider.name,
      model: result.model,
      promptVersion: MATCH_ANALYSIS_PROMPT_VERSION,
      inputSummary,
      tokenUsage: result.usage,
      status: "SUCCEEDED",
    });

    const jobMatch = await createJobMatchForUser(userId, jobId, {
      score: deterministic.score,
      matchedRequirements: deterministic.matchedRequirements,
      missingRequirements: deterministic.missingRequirements,
      transferableSkills: deterministic.transferableSkills,
      hardFilterFailures,
      concerns: result.data.concerns,
      explanation: result.data.explanation,
      aiExecutionId: aiExecution.id,
    });

    return { ok: true, jobMatch, aiDegraded: false };
  } catch {
    // The AI narrative call failed (network error, provider threw, or its
    // output failed MatchAnalysisSchema validation). Never fabricate a
    // narrative and never lose the deterministic half — it's real,
    // non-fabricated data regardless of what the AI call did.
    const aiExecution = await recordAIExecutionForUser(userId, {
      purpose: "MATCH_ANALYSIS",
      provider: provider.name,
      model: "unknown",
      promptVersion: MATCH_ANALYSIS_PROMPT_VERSION,
      inputSummary,
      status: "FAILED",
    });

    const jobMatch = await createJobMatchForUser(userId, jobId, {
      score: deterministic.score,
      matchedRequirements: deterministic.matchedRequirements,
      missingRequirements: deterministic.missingRequirements,
      transferableSkills: deterministic.transferableSkills,
      hardFilterFailures,
      concerns: [],
      explanation: FALLBACK_EXPLANATION,
      aiExecutionId: aiExecution.id,
    });

    return { ok: true, jobMatch, aiDegraded: true };
  }
}

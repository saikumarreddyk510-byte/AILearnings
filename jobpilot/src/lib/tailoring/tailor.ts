import "server-only";
import { getAIProvider } from "@/lib/ai/config";
import { generateValidatedOutput } from "@/lib/ai/generate";
import type { AIProvider } from "@/lib/ai/types";
import { enforceRecommendedChanges } from "@/lib/tailoring/enforce";
import { buildResumeTailoringPrompt } from "@/lib/tailoring/prompt";
import { RESUME_TAILORING_PROMPT_VERSION, ResumeTailoringOutputSchema } from "@/lib/tailoring/schemas";
import { parseResumeVersionSnapshot } from "@/lib/resume/version-snapshot";
import { getJobMatchByIdForUser } from "@/server/data/matches";
import { getLatestVerifiedResumeForUser, getLatestResumeVersionForUser } from "@/server/data/resumes";
import { createTailoredResumeForUser } from "@/server/data/tailored-resumes";
import { recordAIExecutionForUser } from "@/server/data/ai-executions";

export type TailorResumeError =
  | "JOB_MATCH_NOT_FOUND"
  | "NO_VERIFIED_RESUME"
  | "AI_GENERATION_FAILED";

export type TailorResumeResult =
  | { ok: true; tailoredResume: Awaited<ReturnType<typeof createTailoredResumeForUser>> }
  | { ok: false; error: TailorResumeError };

/**
 * Résumé-tailoring flow (spec Core Flow step 10, section F). Unlike
 * matching's analyzeJobMatch, there is no deterministic fallback on AI
 * failure — tailoring has no non-AI-derived content to persist, so a
 * failure returns a typed error and records a FAILED AIExecution, never a
 * fabricated/empty TailoredResume shell. See ARCHITECTURE.md.
 */
export async function tailorResume(
  input: { userId: string; jobMatchId: string },
  provider: AIProvider = getAIProvider()
): Promise<TailorResumeResult> {
  const { userId, jobMatchId } = input;

  const jobMatch = await getJobMatchByIdForUser(jobMatchId, userId);
  if (!jobMatch) return { ok: false, error: "JOB_MATCH_NOT_FOUND" };

  const verified = await getLatestVerifiedResumeForUser(userId);
  if (!verified) return { ok: false, error: "NO_VERIFIED_RESUME" };

  const latestVersion = await getLatestResumeVersionForUser(verified.resume.id, userId);
  if (!latestVersion) return { ok: false, error: "NO_VERIFIED_RESUME" };

  const snapshot = parseResumeVersionSnapshot(latestVersion.snapshot);

  const { systemPrompt, userPrompt } = buildResumeTailoringPrompt({
    job: jobMatch.job,
    deterministic: {
      matchedRequirements: jobMatch.matchedRequirements as string[],
      missingRequirements: jobMatch.missingRequirements as string[],
    },
    snapshotFacts: snapshot.facts,
  });

  const lockedCount = snapshot.facts.filter((f) => f.locked).length;
  // Redacted on purpose: counts/ids only, never raw job.description or
  // résumé fact content (spec: "Redact unnecessary personal information
  // from logs").
  const inputSummary = `job=${jobMatch.job.id} baseVersion=${latestVersion.id} facts=${snapshot.facts.length} locked=${lockedCount}`;

  try {
    const result = await generateValidatedOutput(provider, {
      systemPrompt,
      userPrompt,
      schema: ResumeTailoringOutputSchema,
      metadata: { purpose: "RESUME_TAILORING", promptVersion: RESUME_TAILORING_PROMPT_VERSION },
    });

    const enforcedChanges = enforceRecommendedChanges(result.data.recommendedChanges, snapshot.facts);

    await recordAIExecutionForUser(userId, {
      purpose: "RESUME_TAILORING",
      provider: provider.name,
      model: result.model,
      promptVersion: RESUME_TAILORING_PROMPT_VERSION,
      inputSummary,
      tokenUsage: result.usage,
      status: "SUCCEEDED",
    });

    const tailoredResume = await createTailoredResumeForUser(userId, jobMatchId, {
      baseVersionId: latestVersion.id,
      recommendedChanges: enforcedChanges,
      initialContent: { facts: snapshot.facts },
    });

    return { ok: true, tailoredResume };
  } catch {
    // AI call failed or its output failed schema validation. Unlike
    // analyzeJobMatch, there is no deterministic half to fall back to —
    // persisting an empty/fabricated TailoredResume would be worse than a
    // clear, retryable error, so no row is created.
    await recordAIExecutionForUser(userId, {
      purpose: "RESUME_TAILORING",
      provider: provider.name,
      model: "unknown",
      promptVersion: RESUME_TAILORING_PROMPT_VERSION,
      inputSummary,
      status: "FAILED",
    });

    return { ok: false, error: "AI_GENERATION_FAILED" };
  }
}

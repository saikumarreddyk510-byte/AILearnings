import "server-only";
import { getAIProvider } from "@/lib/ai/config";
import { generateValidatedOutput } from "@/lib/ai/generate";
import type { AIProvider } from "@/lib/ai/types";
import { buildCoverLetterPrompt } from "@/lib/tailoring/cover-letter-prompt";
import { COVER_LETTER_PROMPT_VERSION, CoverLetterOutputSchema } from "@/lib/tailoring/schemas";
import { parseResumeVersionSnapshot } from "@/lib/resume/version-snapshot";
import { getJobMatchByIdForUser } from "@/server/data/matches";
import { getLatestVerifiedResumeForUser, getLatestResumeVersionForUser } from "@/server/data/resumes";
import { createCoverLetterForUser } from "@/server/data/cover-letters";
import { recordAIExecutionForUser } from "@/server/data/ai-executions";

export type GenerateCoverLetterError =
  | "JOB_MATCH_NOT_FOUND"
  | "NO_VERIFIED_RESUME"
  | "AI_GENERATION_FAILED";

export type GenerateCoverLetterResult =
  | {
      ok: true;
      coverLetter: Awaited<ReturnType<typeof createCoverLetterForUser>>;
      hasUnsupportedReferences: boolean;
    }
  | { ok: false; error: GenerateCoverLetterError };

/**
 * Cover letters have no per-sentence review model (ReviewDecision only FKs
 * to TailoredResume) — this is coarser by design. `supportingFactIds` is
 * checked once, here, as a transient, non-persisted warning for the caller
 * to surface; it never blocks generation. See ARCHITECTURE.md.
 */
export async function generateCoverLetter(
  input: { userId: string; jobMatchId: string },
  provider: AIProvider = getAIProvider()
): Promise<GenerateCoverLetterResult> {
  const { userId, jobMatchId } = input;

  const jobMatch = await getJobMatchByIdForUser(jobMatchId, userId);
  if (!jobMatch) return { ok: false, error: "JOB_MATCH_NOT_FOUND" };

  const verified = await getLatestVerifiedResumeForUser(userId);
  if (!verified) return { ok: false, error: "NO_VERIFIED_RESUME" };

  const latestVersion = await getLatestResumeVersionForUser(verified.resume.id, userId);
  if (!latestVersion) return { ok: false, error: "NO_VERIFIED_RESUME" };

  const snapshot = parseResumeVersionSnapshot(latestVersion.snapshot);

  const { systemPrompt, userPrompt } = buildCoverLetterPrompt({
    job: jobMatch.job,
    snapshotFacts: snapshot.facts,
  });

  const inputSummary = `job=${jobMatch.job.id} baseVersion=${latestVersion.id} facts=${snapshot.facts.length}`;

  try {
    const result = await generateValidatedOutput(provider, {
      systemPrompt,
      userPrompt,
      schema: CoverLetterOutputSchema,
      metadata: { purpose: "COVER_LETTER", promptVersion: COVER_LETTER_PROMPT_VERSION },
    });

    await recordAIExecutionForUser(userId, {
      purpose: "COVER_LETTER",
      provider: provider.name,
      model: result.model,
      promptVersion: COVER_LETTER_PROMPT_VERSION,
      inputSummary,
      tokenUsage: result.usage,
      status: "SUCCEEDED",
    });

    const factIds = new Set(snapshot.facts.filter((f) => !!f.id).map((f) => f.id));
    const hasUnsupportedReferences = result.data.supportingFactIds.some((id) => !factIds.has(id));

    const coverLetter = await createCoverLetterForUser(userId, jobMatchId, result.data.coverLetter);

    return { ok: true, coverLetter, hasUnsupportedReferences };
  } catch {
    await recordAIExecutionForUser(userId, {
      purpose: "COVER_LETTER",
      provider: provider.name,
      model: "unknown",
      promptVersion: COVER_LETTER_PROMPT_VERSION,
      inputSummary,
      status: "FAILED",
    });

    return { ok: false, error: "AI_GENERATION_FAILED" };
  }
}

import { z } from "zod";

export const MATCH_ANALYSIS_PROMPT_VERSION = "match-analysis-v1";

/**
 * The *only* thing the AI provider produces for a match analysis — score,
 * matchedRequirements, missingRequirements, and transferableSkills are all
 * computed deterministically (src/lib/matching/score.ts) and never touch
 * this schema. See ARCHITECTURE.md's "Job matching" section for why.
 */
export const MatchAnalysisSchema = z.object({
  concerns: z.array(z.string().min(1)).max(10),
  explanation: z.string().min(1).max(2000),
});
export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;

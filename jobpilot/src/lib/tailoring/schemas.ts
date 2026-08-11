import { z } from "zod";
import { TailorableFactTypeSchema } from "@/lib/enums";

export const RESUME_TAILORING_PROMPT_VERSION = "resume-tailoring-v1";

/**
 * One AI-proposed rewrite. Deliberately narrower than the spec's suggested
 * free-form originalText/proposedText diff: every change targets exactly
 * one existing, unlocked ResumeFact (`targetFactId`) and is a whole-field
 * text replacement. Without a discrete, checkable target, "locked facts
 * cannot be changed by AI" and "unsupported claims are flagged" would be
 * unprovable — see ARCHITECTURE.md's "Résumé tailoring (Phase 5)" section.
 */
export const RecommendedChangeSchema = z.object({
  section: TailorableFactTypeSchema,
  targetFactId: z.string().min(1),
  originalText: z.string().min(1).max(2000),
  proposedText: z.string().min(1).max(2000),
  reason: z.string().min(1).max(500),
  supportingFactIds: z.array(z.string().min(1)).max(10),
  confidence: z.number().min(0).max(1),
});
export type RecommendedChange = z.infer<typeof RecommendedChangeSchema>;

/** The *only* shape the AI provider returns for résumé tailoring. */
export const ResumeTailoringOutputSchema = z.object({
  recommendedChanges: z.array(RecommendedChangeSchema).max(30),
});
export type ResumeTailoringOutput = z.infer<typeof ResumeTailoringOutputSchema>;

/**
 * What actually gets persisted on TailoredResume.recommendedChanges — the
 * AI-proposed shape plus what server-side enforcement (src/lib/tailoring/
 * enforce.ts) computed. A `status !== "OK"` entry is NEVER applied by
 * assemble.ts, no matter what ReviewDecision might exist for it.
 */
export const ENFORCEMENT_STATUSES = [
  "OK",
  "DROPPED_UNSUPPORTED_TARGET",
  "DROPPED_UNSUPPORTED_SUPPORT",
  "DROPPED_LOCKED_FACT",
] as const;
export type EnforcementStatus = (typeof ENFORCEMENT_STATUSES)[number];

export const EnforcedChangeSchema = RecommendedChangeSchema.extend({
  /** changePath = String(index) into this array. Stable for the row's whole lifetime — the array is written once and never mutated after generation. */
  index: z.number().int().min(0),
  status: z.enum(ENFORCEMENT_STATUSES),
  /** confidence < 0.5 — a UI-only flag, never blocks accept/reject/edit. */
  uncertain: z.boolean(),
});
export type EnforcedChange = z.infer<typeof EnforcedChangeSchema>;

export const COVER_LETTER_PROMPT_VERSION = "cover-letter-v1";

export const CoverLetterOutputSchema = z.object({
  coverLetter: z.string().min(1).max(4000),
  /** Fact ids the letter's claims are meant to be grounded in — checked once as a non-blocking warning, not persisted (see ARCHITECTURE.md). */
  supportingFactIds: z.array(z.string().min(1)).max(20),
});
export type CoverLetterOutput = z.infer<typeof CoverLetterOutputSchema>;

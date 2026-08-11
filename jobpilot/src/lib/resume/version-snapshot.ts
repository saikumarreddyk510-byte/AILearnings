import { z } from "zod";
import { RESUME_FACT_TYPES } from "@/lib/enums";

/**
 * The shape of ResumeVersion.snapshot (Json), as written by
 * createResumeVersionForUser (src/server/data/resumes.ts). Each fact's `id`
 * is what lets a Phase 5 recommendedChanges entry name one specific,
 * checkable fact — snapshots created before that field was added parse with
 * `id: undefined` and are simply never used as a fresh baseVersionId.
 */
export const ResumeVersionSnapshotFactSchema = z.object({
  id: z.string().optional(),
  type: z.enum(RESUME_FACT_TYPES),
  content: z.unknown(),
  verified: z.boolean(),
  locked: z.boolean(),
  sortOrder: z.number(),
});
export type ResumeVersionSnapshotFact = z.infer<typeof ResumeVersionSnapshotFactSchema>;

export const ResumeVersionSnapshotSchema = z.object({
  extractedText: z.string().nullable(),
  facts: z.array(ResumeVersionSnapshotFactSchema),
});
export type ResumeVersionSnapshot = z.infer<typeof ResumeVersionSnapshotSchema>;

export function parseResumeVersionSnapshot(json: unknown): ResumeVersionSnapshot {
  return ResumeVersionSnapshotSchema.parse(json);
}

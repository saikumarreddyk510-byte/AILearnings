import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AIExecutionPurpose } from "@/lib/enums";

export interface RecordAIExecutionInput {
  purpose: AIExecutionPurpose;
  provider: string;
  model: string;
  promptVersion: string;
  /** Redacted — counts/ids only, never raw résumé/job text. See callers. */
  inputSummary?: string;
  tokenUsage?: Prisma.InputJsonValue;
  costEstimateCents?: number;
  status?: "SUCCEEDED" | "FAILED";
}

/**
 * Kept separate from src/server/data/matches.ts on purpose — AIExecution is
 * reused unmodified by Phase 5's RESUME_TAILORING/COVER_LETTER purposes, not
 * just MATCH_ANALYSIS, so it shouldn't live inside a "jobs matching" module.
 */
export async function recordAIExecutionForUser(userId: string, data: RecordAIExecutionInput) {
  return db.aIExecution.create({
    data: {
      userId,
      purpose: data.purpose,
      provider: data.provider,
      model: data.model,
      promptVersion: data.promptVersion,
      inputSummary: data.inputSummary,
      tokenUsage: data.tokenUsage,
      costEstimateCents: data.costEstimateCents,
      status: data.status ?? "SUCCEEDED",
    },
  });
}

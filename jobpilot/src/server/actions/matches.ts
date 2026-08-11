"use server";

import { requireUserId } from "@/server/auth/session";
import { analyzeJobMatch, type AnalyzeJobMatchResult } from "@/lib/matching/analyze";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export type AnalyzeJobMatchActionResult =
  | AnalyzeJobMatchResult
  | { ok: false; error: "RATE_LIMITED"; retryAfterSeconds: number };

export async function analyzeJobMatchAction(
  jobId: string,
  searchProfileId: string | null
): Promise<AnalyzeJobMatchActionResult> {
  const userId = await requireUserId();

  // Spec section J: "Add rate limits and spending limits." Keyed per
  // action per user so hammering this action never blocks a different one.
  const rateLimit = checkRateLimit(`ai:analyze:${userId}`, {
    limit: env.RATE_LIMIT_AI_MAX_REQUESTS,
    windowMs: env.RATE_LIMIT_AI_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: "RATE_LIMITED",
      retryAfterSeconds: Math.ceil(rateLimit.retryAfterMs / 1000),
    };
  }

  return analyzeJobMatch({ userId, jobId, searchProfileId });
}

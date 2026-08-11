"use server";

import { requireUserId } from "@/server/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { runAutoPilot, type AutoPilotResult } from "@/lib/auto-pilot/run";

export type RunAutoPilotActionResult =
  | AutoPilotResult
  | { ok: false; error: "RATE_LIMITED"; retryAfterSeconds: number };

/**
 * Auto-Pilot runs a batch of AI calls (analyze + tailor per matched job), so
 * it gets its own rate-limit bucket keyed per user — separate from the
 * per-job analyze/tailor buckets so one never starves the other (spec
 * section J: "Add rate limits and spending limits.").
 */
export async function runAutoPilotAction(
  searchProfileId: string
): Promise<RunAutoPilotActionResult> {
  const userId = await requireUserId();

  const rateLimit = checkRateLimit(`ai:autopilot:${userId}`, {
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

  return runAutoPilot({ userId, searchProfileId });
}

"use server";

import { requireUserId } from "@/server/auth/session";
import { tailorResume, type TailorResumeResult } from "@/lib/tailoring/tailor";
import { generateCoverLetter, type GenerateCoverLetterResult } from "@/lib/tailoring/cover-letter";
import { approveApplicationMaterials } from "@/lib/tailoring/approve";
import { recordReviewDecisionForUser } from "@/server/data/tailored-resumes";
import { updateCoverLetterContentForUser } from "@/server/data/cover-letters";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

type RateLimited = { ok: false; error: "RATE_LIMITED"; retryAfterSeconds: number };

function checkAiRateLimit(key: string): RateLimited | null {
  const rateLimit = checkRateLimit(key, {
    limit: env.RATE_LIMIT_AI_MAX_REQUESTS,
    windowMs: env.RATE_LIMIT_AI_WINDOW_MS,
  });
  if (rateLimit.allowed) return null;
  return { ok: false, error: "RATE_LIMITED", retryAfterSeconds: Math.ceil(rateLimit.retryAfterMs / 1000) };
}

export async function generateTailoredResumeAction(
  jobMatchId: string
): Promise<TailorResumeResult | RateLimited> {
  const userId = await requireUserId();

  // Spec section J: "Add rate limits and spending limits." Keyed per
  // action per user so hammering this action never blocks a different one.
  const limited = checkAiRateLimit(`ai:tailor:${userId}`);
  if (limited) return limited;

  return tailorResume({ userId, jobMatchId });
}

export async function generateCoverLetterAction(
  jobMatchId: string
): Promise<GenerateCoverLetterResult | RateLimited> {
  const userId = await requireUserId();

  const limited = checkAiRateLimit(`ai:cover-letter:${userId}`);
  if (limited) return limited;

  return generateCoverLetter({ userId, jobMatchId });
}

export async function recordReviewDecisionAction(
  tailoredResumeId: string,
  changePath: string,
  decision: "ACCEPTED" | "REJECTED" | "EDITED",
  editedText?: string
) {
  const userId = await requireUserId();
  return recordReviewDecisionForUser(userId, tailoredResumeId, { changePath, decision, editedText });
}

export async function updateCoverLetterAction(coverLetterId: string, content: string) {
  const userId = await requireUserId();
  return updateCoverLetterContentForUser(coverLetterId, userId, content);
}

export async function approveApplicationMaterialsAction(
  jobMatchId: string,
  confirmationText: string
) {
  const userId = await requireUserId();
  return approveApplicationMaterials({ userId, jobMatchId, confirmationText });
}

"use server";

import { requireUserId } from "@/server/auth/session";
import { analyzeJobMatch } from "@/lib/matching/analyze";

export async function analyzeJobMatchAction(jobId: string, searchProfileId: string | null) {
  const userId = await requireUserId();
  return analyzeJobMatch({ userId, jobId, searchProfileId });
}

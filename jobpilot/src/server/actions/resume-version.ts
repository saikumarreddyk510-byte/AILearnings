"use server";

import { requireUserId } from "@/server/auth/session";
import { createResumeVersionForUser } from "@/server/data/resumes";

export async function createResumeVersionAction(masterResumeId: string) {
  const userId = await requireUserId();
  const result = await createResumeVersionForUser(masterResumeId, userId);
  if (!result) {
    return { ok: false as const, error: "Résumé not found." };
  }
  return result;
}

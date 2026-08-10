"use server";

import { requireUserId } from "@/server/auth/session";
import {
  replaceResumeFactsForUser,
  setResumeFactLockedForUser,
} from "@/server/data/resumes";
import type { ResumeFactInput } from "@/lib/resume/fact-schemas";

/**
 * Called directly from the client fact editor (not bound to a <form> — the
 * App Router allows Server Actions to be invoked as ordinary async
 * functions with arbitrary serializable arguments, which fits this
 * nested-array shape better than FormData).
 */
export async function replaceResumeFactsAction(
  masterResumeId: string,
  facts: ResumeFactInput[]
) {
  const userId = await requireUserId();
  const result = await replaceResumeFactsForUser(masterResumeId, userId, facts);
  if (!result) {
    return { ok: false as const, error: "Résumé not found." };
  }
  return result;
}

export async function setResumeFactLockedAction(factId: string, locked: boolean) {
  const userId = await requireUserId();
  const fact = await setResumeFactLockedForUser(factId, userId, locked);
  if (!fact) {
    return { ok: false as const, error: "Fact not found." };
  }
  return { ok: true as const, fact };
}

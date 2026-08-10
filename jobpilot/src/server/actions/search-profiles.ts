"use server";

import { requireUserId } from "@/server/auth/session";
import { SearchProfileInputSchema, type SearchProfileInput } from "@/lib/jobs/schemas";
import {
  createSearchProfileForUser,
  deleteSearchProfileForUser,
  updateSearchProfileForUser,
} from "@/server/data/search-profiles";

export async function createSearchProfileAction(input: SearchProfileInput) {
  const userId = await requireUserId();
  const parsed = SearchProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const profile = await createSearchProfileForUser(userId, parsed.data);
  return { ok: true as const, profile };
}

export async function updateSearchProfileAction(id: string, input: SearchProfileInput) {
  const userId = await requireUserId();
  const parsed = SearchProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const success = await updateSearchProfileForUser(id, userId, parsed.data);
  if (!success) {
    return { ok: false as const, error: "Search profile not found." };
  }
  return { ok: true as const };
}

export async function deleteSearchProfileAction(id: string) {
  const userId = await requireUserId();
  const success = await deleteSearchProfileForUser(id, userId);
  if (!success) {
    return { ok: false as const, error: "Search profile not found." };
  }
  return { ok: true as const };
}

"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { signOut } from "@/server/auth/config";
import { findUserById } from "@/server/data/users";
import { deleteAccountForUser } from "@/server/data/account";

export type DeleteAccountFormState = { message?: string } | undefined;

/**
 * Requires re-entering the current password (not a typed confirmation
 * sentence like Phase 5's approval flow) — deletion's primary threat is a
 * hijacked session (XSS, an unlocked shared machine) triggering an
 * irreversible action without the real owner's intent, which a typed
 * phrase does nothing to defend against. Re-entering the password proves
 * the live credential is present, the standard pattern for destructive
 * account actions.
 */
export async function deleteAccountAction(
  _prevState: DeleteAccountFormState,
  formData: FormData
): Promise<DeleteAccountFormState> {
  const userId = await requireUserId();
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0) {
    return { message: "Enter your password to confirm." };
  }

  const user = await findUserById(userId);
  if (!user) {
    return { message: "Something went wrong. Please sign in again." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { message: "Incorrect password." };
  }

  await deleteAccountForUser(userId);
  await signOut({ redirect: false });
  redirect("/");
}

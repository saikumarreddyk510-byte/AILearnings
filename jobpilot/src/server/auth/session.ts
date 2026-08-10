import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/config";

/**
 * The one place every server component/action/route handler should ask
 * "who is the current user?" — never read the session object directly
 * elsewhere, so this stays the single seam authorization logic flows
 * through (spec section G/security: row-level ownership enforcement).
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Like getCurrentUserId, but redirects to /sign-in instead of returning null. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}

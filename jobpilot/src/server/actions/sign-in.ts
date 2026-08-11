"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/config";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export type SignInFormState = { message?: string } | undefined;

export async function signInWithCredentials(
  _prevState: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  // Checked before signIn() even runs — brute-force protection keyed by
  // the submitted email (spec SECURITY: "Add request validation and rate
  // limiting"). Server Actions have no trustworthy client IP without a
  // reverse-proxy header this MVP doesn't configure, so email is the key.
  const rateLimit = checkRateLimit(`signin:${email}`, {
    limit: env.RATE_LIMIT_SIGNIN_MAX_ATTEMPTS,
    windowMs: env.RATE_LIMIT_SIGNIN_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    const seconds = Math.ceil(rateLimit.retryAfterMs / 1000);
    return { message: `Too many sign-in attempts. Try again in ${seconds}s.` };
  }

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw error;
  }

  redirect("/dashboard");
}

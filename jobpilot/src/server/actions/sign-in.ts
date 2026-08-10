"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/config";

export type SignInFormState = { message?: string } | undefined;

export async function signInWithCredentials(
  _prevState: SignInFormState,
  formData: FormData
): Promise<SignInFormState> {
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

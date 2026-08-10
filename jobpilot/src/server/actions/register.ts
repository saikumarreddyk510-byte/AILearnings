"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/config";
import { createUser, findUserByEmail } from "@/server/data/users";

/**
 * Credentials has no built-in sign-up flow, so registration is a plain
 * Server Action wired to `useActionState` on the client — same pattern as
 * the official Next.js authentication guide.
 */
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long.").trim(),
  email: z.string().email("Please enter a valid email.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export type RegisterFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function registerUser(
  _prevState: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return {
      errors: { email: ["An account with this email already exists."] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await createUser({ email, passwordHash, name });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          "Account created, but automatic sign-in failed. Please sign in manually.",
      };
    }
    throw error;
  }

  redirect("/dashboard");
}

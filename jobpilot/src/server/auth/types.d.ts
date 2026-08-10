import type { DefaultSession } from "next-auth";

// Augment the default session/JWT types so `session.user.id` is a known,
// typed field everywhere in the app instead of an `any`-typed cast.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
  }
}

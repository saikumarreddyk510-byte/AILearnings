import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type { signInWithCredentials as SignInFn } from "@/server/actions/sign-in";
import type { env as EnvType } from "@/lib/env";
import { __resetRateLimitsForTests } from "@/lib/rate-limit";

const TEST_DB_PATH = "./prisma/test-rate-limit-signin.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const PASSWORD = "Password123!";
const CORRECT_EMAIL_PASSWORD = new Set([
  ["ratelimit-signin@example.com", PASSWORD].join(":"),
  ["ratelimit-signin-other@example.com", PASSWORD].join(":"),
]);

// Importing the real "next-auth" package (even just its AuthError export)
// or "@/server/auth/config" (which evaluates NextAuth(...) at module
// scope) reaches into next-auth internals that require "next/server" —
// unavailable outside Next's own runtime/bundler (no existing test in this
// repo invokes a signIn()-calling action, so there was no established
// precedent; confirmed empirically both imports fail the same way).
// Mocking both boundaries lets sign-in.ts's real rate-limit logic run for
// real while never touching next-auth's actual machinery.
class FakeAuthError extends Error {}
vi.mock("next-auth", () => ({ AuthError: FakeAuthError }));
vi.mock("@/server/auth/config", () => ({
  signIn: vi.fn(async (_provider: string, opts: { email: string; password: string }) => {
    const key = [opts.email, opts.password].join(":");
    if (!CORRECT_EMAIL_PASSWORD.has(key)) {
      throw new FakeAuthError("CredentialsSignin");
    }
    return undefined;
  }),
}));

describe("signInWithCredentials rate limiting", () => {
  let db: typeof DbClient;
  let signInWithCredentials: typeof SignInFn;
  let env: typeof EnvType;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    // Dynamically imported, like `db` and `signInWithCredentials` below —
    // NOT statically imported at module scope. src/lib/env.ts snapshots
    // process.env once, at first import; a static top-level `import { env }`
    // here would evaluate it (via tests/setup-env.ts's generic
    // DATABASE_URL) before the file-specific override above ever runs,
    // and src/lib/db.ts would silently connect to the wrong SQLite file.
    ({ db } = await import("@/lib/db"));
    ({ env } = await import("@/lib/env"));
    ({ signInWithCredentials } = await import("@/server/actions/sign-in"));

    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    await db.user.create({
      data: { email: "ratelimit-signin@example.com", passwordHash, name: "Rate Limit Tester" },
    });
    await db.user.create({
      data: {
        email: "ratelimit-signin-other@example.com",
        passwordHash,
        name: "Other User",
      },
    });
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  beforeEach(() => {
    __resetRateLimitsForTests();
  });

  it("blocks further attempts — even with the correct password — once the attempt limit is reached", async () => {
    const form = (password: string) => {
      const fd = new FormData();
      fd.set("email", "ratelimit-signin@example.com");
      fd.set("password", password);
      return fd;
    };

    for (let i = 0; i < env.RATE_LIMIT_SIGNIN_MAX_ATTEMPTS; i++) {
      const result = await signInWithCredentials(undefined, form("wrong-password"));
      expect(result?.message).toBe("Invalid email or password.");
    }

    // The (limit+1)th attempt is blocked by the rate limiter BEFORE signIn()
    // ever runs — proven by using the correct password here and still
    // getting the rate-limit message, not a successful sign-in.
    const blocked = await signInWithCredentials(undefined, form(PASSWORD));
    expect(blocked?.message).toMatch(/too many sign-in attempts/i);
  });

  it("does not affect a different email in the same window", async () => {
    const formFor = (email: string) => {
      const fd = new FormData();
      fd.set("email", email);
      fd.set("password", "wrong-password");
      return fd;
    };

    for (let i = 0; i < env.RATE_LIMIT_SIGNIN_MAX_ATTEMPTS; i++) {
      await signInWithCredentials(undefined, formFor("ratelimit-signin@example.com"));
    }
    const blockedFirst = await signInWithCredentials(
      undefined,
      formFor("ratelimit-signin@example.com")
    );
    expect(blockedFirst?.message).toMatch(/too many sign-in attempts/i);

    const otherEmailResult = await signInWithCredentials(
      undefined,
      formFor("ratelimit-signin-other@example.com")
    );
    expect(otherEmailResult?.message).toBe("Invalid email or password.");
  });
});

import "server-only";
import { z } from "zod";

/**
 * All process.env access in the app should go through this file, not
 * process.env directly, so a missing/invalid variable fails loudly at
 * startup with a clear message instead of surfacing as a confusing error
 * deep inside a request handler.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().optional(),

  // AI provider: "mock" needs no credentials and is the safe default for
  // local dev/tests. "openai" is stubbed in Phase 1 (see src/lib/ai).
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().optional().default("gpt-4o-mini"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Résumé upload ceiling (bytes). Defaults to 5MB; keep next.config.ts's
  // serverActions.bodySizeLimit comfortably above this.
  RESUME_MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),

  // CSV job-import ceilings.
  JOB_CSV_MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(1 * 1024 * 1024),
  JOB_CSV_MAX_ROWS: z.coerce.number().int().positive().default(200),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();

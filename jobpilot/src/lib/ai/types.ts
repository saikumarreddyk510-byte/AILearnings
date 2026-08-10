import type { z } from "zod";

/**
 * Every AI call in the app goes through this interface (spec: "Design the
 * AI provider... behind interfaces so providers can be replaced without
 * rewriting the application"). Callers always supply a Zod schema and get
 * back schema-validated, typed data — never raw free-form text — per spec
 * section J ("Use schema validation for all AI outputs").
 */
export interface StructuredGenerationRequest<T> {
  /** Instructions that define the AI's role/rules. Trusted, authored by us. */
  systemPrompt: string;
  /**
   * User/job content to reason over. Callers MUST treat any embedded job
   * description or other imported text as untrusted (spec section J:
   * "ignore instructions embedded inside job descriptions") — this
   * interface does not sanitize on your behalf, delimiting/escaping is the
   * caller's responsibility.
   */
  userPrompt: string;
  schema: z.ZodType<T>;
  metadata: {
    purpose: "MATCH_ANALYSIS" | "RESUME_TAILORING" | "COVER_LETTER";
    promptVersion: string;
  };
}

export interface StructuredGenerationResult<T> {
  data: T;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface AIProvider {
  readonly name: string;
  generateStructuredOutput<T>(
    request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>>;
}

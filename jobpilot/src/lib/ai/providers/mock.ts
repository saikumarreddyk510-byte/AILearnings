import type {
  AIProvider,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from "@/lib/ai/types";

/**
 * Deterministic, schema-valid, no-API-key-required provider. This is the
 * default in dev/test (AI_PROVIDER=mock) so nothing in the test suite ever
 * needs a real OpenAI key. It fabricates *placeholder structure*, never
 * real résumé content — Phase 4/5 callers still supply real verified facts
 * as input, this just stands in for what an LLM call would return.
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generateStructuredOutput<T>(
    request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>> {
    const placeholder = buildPlaceholder(request.metadata.purpose);
    const data = request.schema.parse(placeholder);

    return {
      data,
      model: "mock-1",
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }
}

function buildPlaceholder(
  purpose: StructuredGenerationRequest<unknown>["metadata"]["purpose"]
): unknown {
  switch (purpose) {
    case "MATCH_ANALYSIS":
      return {
        concerns: [],
        explanation: "No real AI provider is configured (AI_PROVIDER=mock).",
      };
    case "RESUME_TAILORING":
      return { recommendedChanges: [] };
    case "COVER_LETTER":
      return {
        coverLetter: "No real AI provider is configured (AI_PROVIDER=mock).",
        supportingFactIds: [],
      };
    default:
      return {};
  }
}

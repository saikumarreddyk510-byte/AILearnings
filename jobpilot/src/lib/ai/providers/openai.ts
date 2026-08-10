import type {
  AIProvider,
  StructuredGenerationRequest,
  StructuredGenerationResult,
} from "@/lib/ai/types";

/**
 * Stubbed on purpose for Phase 1: the interface + config wiring exists so
 * AI_PROVIDER=openai can be selected, but no real API call is made yet.
 * The real implementation (calling the OpenAI API and validating the
 * response against `request.schema`) lands in Phase 4/5 alongside the
 * matching/tailoring features that actually need it — this file is the
 * only one that will need to change when that happens.
 */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(private readonly apiKey: string, private readonly model: string) {}

  async generateStructuredOutput<T>(
    _request: StructuredGenerationRequest<T>
  ): Promise<StructuredGenerationResult<T>> {
    if (!this.apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Configure it in .env to use AI_PROVIDER=openai."
      );
    }
    throw new Error(
      `OpenAIProvider.generateStructuredOutput is not implemented yet (model=${this.model}). ` +
        "This lands in Phase 4/5 alongside AI matching/tailoring. Use AI_PROVIDER=mock for now."
    );
  }
}

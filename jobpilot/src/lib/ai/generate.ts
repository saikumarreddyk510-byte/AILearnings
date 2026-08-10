import "server-only";
import type { AIProvider, StructuredGenerationRequest, StructuredGenerationResult } from "@/lib/ai/types";

/**
 * Thin wrapper around AIProvider.generateStructuredOutput that
 * unconditionally re-validates the returned data against the caller's
 * schema. Well-behaved providers (MockAIProvider) already validate
 * internally, but this boundary must not *rely* on that — a provider
 * implementation that skips its own validation (a bug, or some future
 * third-party provider) must never be able to smuggle non-conforming data
 * past callers. Spec: "AI output failing schema validation is rejected."
 * Takes an explicit `provider` (rather than calling getAIProvider()
 * itself) so it stays trivially testable with a fake/misbehaving provider.
 */
export async function generateValidatedOutput<T>(
  provider: AIProvider,
  request: StructuredGenerationRequest<T>
): Promise<StructuredGenerationResult<T>> {
  const result = await provider.generateStructuredOutput(request);
  const data = request.schema.parse(result.data);
  return { ...result, data };
}

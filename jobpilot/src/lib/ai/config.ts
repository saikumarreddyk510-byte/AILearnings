import "server-only";
import { env } from "@/lib/env";
import type { AIProvider } from "@/lib/ai/types";
import { MockAIProvider } from "@/lib/ai/providers/mock";
import { OpenAIProvider } from "@/lib/ai/providers/openai";

let cached: AIProvider | undefined;

/**
 * Factory selecting the active AIProvider from AI_PROVIDER. Every caller
 * should go through this instead of `new`-ing a provider directly, so
 * swapping providers is a one-line env change.
 */
export function getAIProvider(): AIProvider {
  if (cached) return cached;

  switch (env.AI_PROVIDER) {
    case "openai":
      cached = new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL);
      break;
    case "mock":
    default:
      cached = new MockAIProvider();
      break;
  }
  return cached;
}

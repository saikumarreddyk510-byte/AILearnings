import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateValidatedOutput } from "@/lib/ai/generate";
import type { AIProvider } from "@/lib/ai/types";

const TestSchema = z.object({ concerns: z.array(z.string()), explanation: z.string() });

function fakeProvider(returnedData: unknown): AIProvider {
  return {
    name: "fake",
    async generateStructuredOutput() {
      // Deliberately skips validating `returnedData` against the caller's
      // schema — simulating a misbehaving/buggy provider implementation
      // that doesn't self-validate.
      return { data: returnedData as never, model: "fake-1" };
    },
  };
}

describe("generateValidatedOutput", () => {
  it("passes through valid data unchanged", async () => {
    const provider = fakeProvider({ concerns: ["a"], explanation: "fine" });
    const result = await generateValidatedOutput(provider, {
      systemPrompt: "s",
      userPrompt: "u",
      schema: TestSchema,
      metadata: { purpose: "MATCH_ANALYSIS", promptVersion: "v1" },
    });
    expect(result.data).toEqual({ concerns: ["a"], explanation: "fine" });
  });

  it("throws when the provider returns data that fails the schema (never trusts the provider blindly)", async () => {
    const provider = fakeProvider({ concerns: "not an array", explanation: 12345 });
    await expect(
      generateValidatedOutput(provider, {
        systemPrompt: "s",
        userPrompt: "u",
        schema: TestSchema,
        metadata: { purpose: "MATCH_ANALYSIS", promptVersion: "v1" },
      })
    ).rejects.toThrow();
  });

  it("throws when the provider returns an object missing required fields", async () => {
    const provider = fakeProvider({ concerns: [] }); // missing `explanation`
    await expect(
      generateValidatedOutput(provider, {
        systemPrompt: "s",
        userPrompt: "u",
        schema: TestSchema,
        metadata: { purpose: "MATCH_ANALYSIS", promptVersion: "v1" },
      })
    ).rejects.toThrow();
  });
});

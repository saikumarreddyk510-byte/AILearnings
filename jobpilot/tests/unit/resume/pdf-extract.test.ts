import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractTextFromPdf } from "@/lib/resume/pdf";
import { FIXTURE_MARKER } from "../../fixtures/resume-fixture-marker";

describe("extractTextFromPdf", () => {
  it("extracts the known marker text from the fixture PDF", async () => {
    const buffer = readFileSync("tests/fixtures/resumes/sample.pdf");
    const text = await extractTextFromPdf(buffer);
    expect(text).toContain(FIXTURE_MARKER);
  });
});

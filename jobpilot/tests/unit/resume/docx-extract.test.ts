import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractTextFromDocx } from "@/lib/resume/docx";
import { FIXTURE_MARKER } from "../../fixtures/resume-fixture-marker";

describe("extractTextFromDocx", () => {
  it("extracts the known marker text from the fixture DOCX", async () => {
    const buffer = readFileSync("tests/fixtures/resumes/sample.docx");
    const text = await extractTextFromDocx(buffer);
    expect(text).toContain(FIXTURE_MARKER);
  });
});

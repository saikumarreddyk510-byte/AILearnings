import { describe, expect, it } from "vitest";
import { normalizeJobInput } from "@/lib/jobs/normalize";

const BASE = {
  company: "Acme Corp",
  title: "Engineer",
  description: "Build things.",
  sourceUrl: "https://example.com/job",
};

describe("normalizeJobInput", () => {
  it("trims strings", () => {
    const result = normalizeJobInput({ ...BASE, company: "  Acme Corp  " });
    expect(result.company).toBe("Acme Corp");
  });

  it("drops an invalid workplaceType instead of throwing", () => {
    const result = normalizeJobInput({ ...BASE, workplaceType: "MOON_BASE" });
    expect(result.workplaceType).toBeUndefined();
  });

  it("accepts a valid workplaceType case-insensitively", () => {
    const result = normalizeJobInput({ ...BASE, workplaceType: "remote" });
    expect(result.workplaceType).toBe("REMOTE");
  });

  it("drops an invalid employmentType instead of throwing", () => {
    const result = normalizeJobInput({ ...BASE, employmentType: "GIG" });
    expect(result.employmentType).toBeUndefined();
  });

  it("swaps salaryMin/salaryMax when min > max", () => {
    const result = normalizeJobInput({ ...BASE, salaryMin: "200000", salaryMax: "100000" });
    expect(result.salaryMin).toBe(100000);
    expect(result.salaryMax).toBe(200000);
  });

  it("drops an invalid datePosted instead of throwing", () => {
    const result = normalizeJobInput({ ...BASE, datePosted: "not-a-date" });
    expect(result.datePosted).toBeUndefined();
  });

  it("parses a valid datePosted", () => {
    const result = normalizeJobInput({ ...BASE, datePosted: "2026-01-15" });
    expect(result.datePosted).toBeInstanceOf(Date);
  });

  it("computes a contentFingerprint", () => {
    const result = normalizeJobInput(BASE);
    expect(result.contentFingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it("filters empty strings out of skill lists", () => {
    const result = normalizeJobInput({
      ...BASE,
      requiredSkills: ["React", "  ", "TypeScript"],
    });
    expect(result.requiredSkills).toEqual(["React", "TypeScript"]);
  });
});

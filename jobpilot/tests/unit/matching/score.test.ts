import { describe, expect, it } from "vitest";
import { computeMatchScore, type ResumeFactLike } from "@/lib/matching/score";

function skillFact(name: string): ResumeFactLike {
  return { type: "SKILL", content: { name } };
}
function workHistoryFact(title: string): ResumeFactLike {
  return { type: "WORK_HISTORY", content: { title, company: "X", startDate: "2020" } };
}

const BASE_JOB = {
  title: "Backend Engineer",
  description: "We use Python and Docker every day.",
  requiredSkills: ["Python", "SQL"],
  preferredSkills: ["Docker"],
};

describe("computeMatchScore", () => {
  it("scores 100 with full required+preferred+title overlap", () => {
    const result = computeMatchScore({
      job: { ...BASE_JOB, title: "Backend Engineer" },
      resumeFacts: [
        skillFact("Python"),
        skillFact("SQL"),
        skillFact("Docker"),
        workHistoryFact("Backend Engineer"),
      ],
    });
    expect(result.score).toBe(100);
    expect(result.matchedRequirements).toEqual(
      expect.arrayContaining(["Python (required)", "SQL (required)", "Docker (preferred)"])
    );
    expect(result.missingRequirements).toHaveLength(0);
  });

  it("scores low with zero overlap and lists the missing required skills", () => {
    const result = computeMatchScore({
      job: BASE_JOB,
      resumeFacts: [skillFact("Java"), skillFact("Kotlin")],
    });
    expect(result.score).toBeLessThan(30);
    expect(result.missingRequirements).toEqual(expect.arrayContaining(["Python", "SQL"]));
    expect(result.matchedRequirements).toHaveLength(0);
  });

  it("scores partial overlap between the two extremes", () => {
    const result = computeMatchScore({
      job: BASE_JOB,
      resumeFacts: [skillFact("Python")],
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.matchedRequirements).toContain("Python (required)");
    expect(result.missingRequirements).toContain("SQL");
  });

  it("gives full role-title credit for an exact WORK_HISTORY title match", () => {
    const withTitle = computeMatchScore({
      job: BASE_JOB,
      resumeFacts: [workHistoryFact("Backend Engineer")],
    });
    const withoutTitle = computeMatchScore({ job: BASE_JOB, resumeFacts: [] });
    expect(withTitle.score).toBeGreaterThan(withoutTitle.score);
  });

  it("gives partial role-title credit for a token overlap", () => {
    const partial = computeMatchScore({
      job: BASE_JOB,
      resumeFacts: [workHistoryFact("Senior Backend Developer")],
    });
    const none = computeMatchScore({
      job: BASE_JOB,
      resumeFacts: [workHistoryFact("Product Manager")],
    });
    expect(partial.score).toBeGreaterThan(none.score);
  });

  it("treats an empty required/preferred skill list as full credit (fail-open), not zero", () => {
    const result = computeMatchScore({
      job: { ...BASE_JOB, requiredSkills: [], preferredSkills: [] },
      resumeFacts: [],
    });
    // Full credit on both skill ratios even though nothing was "matched" —
    // matched/missing lists stay honestly empty, only the score reflects
    // the fail-open ratio.
    expect(result.matchedRequirements).toHaveLength(0);
    expect(result.missingRequirements).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(85); // 60+25 ratio credit, title bonus may vary
  });

  it("derives transferableSkills from résumé skills mentioned in the free-text description but not in structured lists", () => {
    const result = computeMatchScore({
      job: {
        ...BASE_JOB,
        description: "We use Python and Docker every day, plus some Kubernetes.",
      },
      resumeFacts: [skillFact("Docker"), skillFact("Kubernetes")],
    });
    // "Docker" is already a structured preferredSkill — shouldn't double-count.
    expect(result.transferableSkills).not.toContain("Docker");
    // "Kubernetes" is only in the free-text description — that's the
    // transferable-skill signal.
    expect(result.transferableSkills).toContain("Kubernetes");
  });
});

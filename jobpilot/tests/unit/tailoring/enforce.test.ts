import { describe, expect, it } from "vitest";
import { enforceRecommendedChanges } from "@/lib/tailoring/enforce";
import type { RecommendedChange } from "@/lib/tailoring/schemas";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";

function makeChange(overrides: Partial<RecommendedChange> = {}): RecommendedChange {
  return {
    section: "SUMMARY",
    targetFactId: "fact-summary",
    originalText: "Old summary.",
    proposedText: "New summary.",
    reason: "Better fit.",
    supportingFactIds: [],
    confidence: 0.8,
    ...overrides,
  };
}

const unlockedSummary: ResumeVersionSnapshotFact = {
  id: "fact-summary",
  type: "SUMMARY",
  content: { text: "Old summary." },
  verified: true,
  locked: false,
  sortOrder: 0,
};

const lockedSkill: ResumeVersionSnapshotFact = {
  id: "fact-skill-locked",
  type: "SKILL",
  content: { name: "Python" },
  verified: true,
  locked: true,
  sortOrder: 1,
};

describe("enforceRecommendedChanges", () => {
  it("locked résumé facts cannot be changed by AI", () => {
    const [result] = enforceRecommendedChanges(
      [makeChange({ targetFactId: "fact-skill-locked", section: "SKILL" })],
      [unlockedSummary, lockedSkill]
    );
    expect(result.status).toBe("DROPPED_LOCKED_FACT");
    expect(result.status).not.toBe("OK");
  });

  it("flags unsupported résumé claims (bad targetFactId) instead of inserting them", () => {
    const [result] = enforceRecommendedChanges(
      [makeChange({ targetFactId: "does-not-exist" })],
      [unlockedSummary]
    );
    expect(result.status).toBe("DROPPED_UNSUPPORTED_TARGET");
    // Still present in the output — not deleted, so the review UI can show it.
    expect(result.targetFactId).toBe("does-not-exist");
  });

  it("flags unsupported résumé claims (bad supportingFactIds) instead of inserting them", () => {
    const [result] = enforceRecommendedChanges(
      [makeChange({ supportingFactIds: ["ghost-fact"] })],
      [unlockedSummary]
    );
    expect(result.status).toBe("DROPPED_UNSUPPORTED_SUPPORT");
  });

  it("marks a well-formed change against a real, unlocked fact as OK", () => {
    const [result] = enforceRecommendedChanges([makeChange()], [unlockedSummary]);
    expect(result.status).toBe("OK");
  });

  it("flags low-confidence changes as uncertain without blocking them", () => {
    const [result] = enforceRecommendedChanges(
      [makeChange({ confidence: 0.2 })],
      [unlockedSummary]
    );
    expect(result.status).toBe("OK");
    expect(result.uncertain).toBe(true);
  });

  it("assigns a stable index matching array position", () => {
    const results = enforceRecommendedChanges(
      [makeChange(), makeChange({ targetFactId: "fact-skill-locked", section: "SKILL" })],
      [unlockedSummary, lockedSkill]
    );
    expect(results[0].index).toBe(0);
    expect(results[1].index).toBe(1);
  });
});

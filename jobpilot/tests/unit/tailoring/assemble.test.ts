import { describe, expect, it } from "vitest";
import { assembleTailoredContent, type ReviewDecisionLike } from "@/lib/tailoring/assemble";
import type { EnforcedChange } from "@/lib/tailoring/schemas";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";

const baseFacts: ResumeVersionSnapshotFact[] = [
  {
    id: "fact-summary",
    type: "SUMMARY",
    content: { text: "Original summary." },
    verified: true,
    locked: false,
    sortOrder: 0,
  },
];

function makeChange(overrides: Partial<EnforcedChange> = {}): EnforcedChange {
  return {
    section: "SUMMARY",
    targetFactId: "fact-summary",
    originalText: "Original summary.",
    proposedText: "Tailored summary.",
    reason: "Better fit.",
    supportingFactIds: [],
    confidence: 0.9,
    index: 0,
    status: "OK",
    uncertain: false,
    ...overrides,
  };
}

describe("assembleTailoredContent", () => {
  it("applies proposedText for an ACCEPTED decision", () => {
    const decisions = new Map<string, ReviewDecisionLike>([
      ["0", { decision: "ACCEPTED", editedText: null }],
    ]);
    const { facts } = assembleTailoredContent(baseFacts, [makeChange()], decisions);
    expect((facts[0].content as { text: string }).text).toBe("Tailored summary.");
  });

  it("applies editedText for an EDITED decision", () => {
    const decisions = new Map<string, ReviewDecisionLike>([
      ["0", { decision: "EDITED", editedText: "User-edited summary." }],
    ]);
    const { facts } = assembleTailoredContent(baseFacts, [makeChange()], decisions);
    expect((facts[0].content as { text: string }).text).toBe("User-edited summary.");
  });

  it("leaves the original untouched for a REJECTED decision", () => {
    const decisions = new Map<string, ReviewDecisionLike>([
      ["0", { decision: "REJECTED", editedText: null }],
    ]);
    const { facts } = assembleTailoredContent(baseFacts, [makeChange()], decisions);
    expect((facts[0].content as { text: string }).text).toBe("Original summary.");
  });

  it("leaves the original untouched when there is no decision at all", () => {
    const { facts } = assembleTailoredContent(baseFacts, [makeChange()], new Map());
    expect((facts[0].content as { text: string }).text).toBe("Original summary.");
  });

  it("never applies a dropped change even given a forged ACCEPTED decision", () => {
    const decisions = new Map<string, ReviewDecisionLike>([
      ["0", { decision: "ACCEPTED", editedText: null }],
    ]);
    const dropped = makeChange({ status: "DROPPED_LOCKED_FACT" });
    const { facts } = assembleTailoredContent(baseFacts, [dropped], decisions);
    expect((facts[0].content as { text: string }).text).toBe("Original summary.");
  });

  it("splits WORK_HISTORY/PROJECT proposedText into bullets on newlines", () => {
    const workFacts: ResumeVersionSnapshotFact[] = [
      {
        id: "fact-work",
        type: "WORK_HISTORY",
        content: { company: "Acme", title: "Engineer", bullets: ["Old bullet"] },
        verified: true,
        locked: false,
        sortOrder: 0,
      },
    ];
    const change = makeChange({
      section: "WORK_HISTORY",
      targetFactId: "fact-work",
      proposedText: "Built X\nShipped Y\n\nImproved Z",
    });
    const decisions = new Map<string, ReviewDecisionLike>([
      ["0", { decision: "ACCEPTED", editedText: null }],
    ]);
    const { facts } = assembleTailoredContent(workFacts, [change], decisions);
    expect((facts[0].content as { bullets: string[] }).bullets).toEqual([
      "Built X",
      "Shipped Y",
      "Improved Z",
    ]);
  });

  it("does not mutate the input baseFacts array", () => {
    const decisions = new Map<string, ReviewDecisionLike>([
      ["0", { decision: "ACCEPTED", editedText: null }],
    ]);
    assembleTailoredContent(baseFacts, [makeChange()], decisions);
    expect((baseFacts[0].content as { text: string }).text).toBe("Original summary.");
  });
});

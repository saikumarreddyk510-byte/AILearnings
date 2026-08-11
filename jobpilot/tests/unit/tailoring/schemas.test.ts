import { describe, expect, it } from "vitest";
import {
  RecommendedChangeSchema,
  ResumeTailoringOutputSchema,
  CoverLetterOutputSchema,
} from "@/lib/tailoring/schemas";

const validChange = {
  section: "SUMMARY",
  targetFactId: "fact-1",
  originalText: "Old",
  proposedText: "New",
  reason: "Better fit",
  supportingFactIds: [],
  confidence: 0.5,
};

describe("RecommendedChangeSchema", () => {
  it("accepts a well-formed change", () => {
    expect(() => RecommendedChangeSchema.parse(validChange)).not.toThrow();
  });

  it("rejects confidence outside [0,1]", () => {
    expect(() => RecommendedChangeSchema.parse({ ...validChange, confidence: 1.5 })).toThrow();
    expect(() => RecommendedChangeSchema.parse({ ...validChange, confidence: -0.1 })).toThrow();
  });

  it("rejects an unknown section value", () => {
    expect(() => RecommendedChangeSchema.parse({ ...validChange, section: "CONTACT" })).toThrow();
    expect(() => RecommendedChangeSchema.parse({ ...validChange, section: "NOT_REAL" })).toThrow();
  });

  it("rejects a missing targetFactId", () => {
    const { targetFactId: _unused, ...withoutTarget } = validChange;
    void _unused;
    expect(() => RecommendedChangeSchema.parse(withoutTarget)).toThrow();
  });

  it("rejects an empty proposedText", () => {
    expect(() => RecommendedChangeSchema.parse({ ...validChange, proposedText: "" })).toThrow();
  });
});

describe("ResumeTailoringOutputSchema", () => {
  it("accepts an empty recommendedChanges array (the mock provider's placeholder)", () => {
    expect(() => ResumeTailoringOutputSchema.parse({ recommendedChanges: [] })).not.toThrow();
  });

  it("rejects more than 30 changes", () => {
    const many = Array.from({ length: 31 }, () => validChange);
    expect(() => ResumeTailoringOutputSchema.parse({ recommendedChanges: many })).toThrow();
  });
});

describe("CoverLetterOutputSchema", () => {
  it("rejects an empty coverLetter", () => {
    expect(() =>
      CoverLetterOutputSchema.parse({ coverLetter: "", supportingFactIds: [] })
    ).toThrow();
  });

  it("accepts a non-empty coverLetter with no supporting facts", () => {
    expect(() =>
      CoverLetterOutputSchema.parse({ coverLetter: "Dear hiring manager,", supportingFactIds: [] })
    ).not.toThrow();
  });
});

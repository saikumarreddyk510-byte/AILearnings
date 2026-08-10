import { describe, expect, it } from "vitest";
import { computeContentFingerprint } from "@/lib/jobs/fingerprint";

describe("computeContentFingerprint", () => {
  it("produces the same hash for content differing only in case/whitespace", () => {
    const a = computeContentFingerprint({
      company: "Acme Corp",
      title: "Senior  Engineer",
      description: "Build things.  ",
    });
    const b = computeContentFingerprint({
      company: "  acme corp",
      title: "senior engineer",
      description: "build things.",
    });
    expect(a).toBe(b);
  });

  it("produces a different hash when the content actually differs", () => {
    const a = computeContentFingerprint({
      company: "Acme Corp",
      title: "Senior Engineer",
      description: "Build things.",
    });
    const b = computeContentFingerprint({
      company: "Acme Corp",
      title: "Junior Engineer",
      description: "Build things.",
    });
    expect(a).not.toBe(b);
  });

  it("returns a 64-character hex sha256 digest", () => {
    const hash = computeContentFingerprint({
      company: "Acme",
      title: "Engineer",
      description: "Build things.",
    });
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

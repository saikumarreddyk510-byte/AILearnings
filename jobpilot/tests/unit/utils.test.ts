import { describe, expect, it } from "vitest";
import { clampMatchScore } from "@/lib/utils";

describe("clampMatchScore", () => {
  it("keeps in-range scores unchanged", () => {
    expect(clampMatchScore(72)).toBe(72);
  });

  it("clamps scores above 100 down to 100", () => {
    expect(clampMatchScore(140)).toBe(100);
  });

  it("clamps negative scores up to 0", () => {
    expect(clampMatchScore(-15)).toBe(0);
  });

  it("rounds fractional scores", () => {
    expect(clampMatchScore(83.6)).toBe(84);
  });
});

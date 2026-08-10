import { describe, expect, it } from "vitest";
import { SearchProfileInputSchema } from "@/lib/jobs/schemas";

describe("SearchProfileInputSchema", () => {
  it("accepts a full, valid input covering every Feature B field", () => {
    const result = SearchProfileInputSchema.safeParse({
      name: "Frontend roles",
      targetRoleTitles: ["Frontend Engineer"],
      alternateRoleTitles: ["UI Engineer"],
      requiredSkills: ["React"],
      optionalSkills: ["GraphQL"],
      locations: ["Remote"],
      workplaceTypes: ["REMOTE", "HYBRID"],
      minSalary: 120000,
      employmentTypes: ["FULL_TIME"],
      experienceLevel: "SENIOR",
      preferredIndustries: ["Fintech"],
      excludedCompanies: ["Bad Co"],
      requiredKeywords: ["typescript"],
      excludedKeywords: ["php"],
      sponsorshipRequired: true,
      maxPostingAgeDays: 30,
      searchFrequency: "WEEKLY",
    });
    expect(result.success).toBe(true);
  });

  it("accepts the minimal valid input (just name + one target role title)", () => {
    const result = SearchProfileInputSchema.safeParse({
      name: "Anything",
      targetRoleTitles: ["Engineer"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.searchFrequency).toBe("DAILY");
      expect(result.data.sponsorshipRequired).toBe(false);
    }
  });

  it("rejects a missing name", () => {
    const result = SearchProfileInputSchema.safeParse({ targetRoleTitles: ["Engineer"] });
    expect(result.success).toBe(false);
  });

  it("rejects an empty targetRoleTitles array", () => {
    const result = SearchProfileInputSchema.safeParse({ name: "X", targetRoleTitles: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid workplaceTypes entry", () => {
    const result = SearchProfileInputSchema.safeParse({
      name: "X",
      targetRoleTitles: ["Engineer"],
      workplaceTypes: ["MOON_BASE"],
    });
    expect(result.success).toBe(false);
  });
});

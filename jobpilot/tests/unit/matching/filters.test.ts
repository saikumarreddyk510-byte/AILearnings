import { describe, expect, it } from "vitest";
import { applyHardFilters } from "@/lib/matching/filters";
import type { Job, SearchProfile } from "@/generated/prisma/client";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    source: "MANUAL_PASTE",
    sourceJobId: "src-1",
    sourceUrl: "https://example.com",
    applicationUrl: null,
    company: "Acme Corp",
    title: "Senior Engineer",
    description: "Build things.",
    location: "Austin, TX",
    workplaceType: "HYBRID",
    salaryMin: 120000,
    salaryMax: 160000,
    employmentType: "FULL_TIME",
    requiredSkills: [],
    preferredSkills: [],
    experienceRequirements: null,
    educationRequirements: null,
    sponsorshipInfo: null,
    datePosted: new Date(),
    dateDiscovered: new Date(),
    applicationDeadline: null,
    attribution: null,
    contentFingerprint: "fp",
    raw: null,
    createdByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Job;
}

function makeProfile(overrides: Partial<SearchProfile> = {}): SearchProfile {
  return {
    id: "profile-1",
    userId: "user-1",
    name: "Test profile",
    targetRoleTitles: ["Engineer"],
    alternateRoleTitles: [],
    requiredSkills: [],
    optionalSkills: [],
    locations: [],
    workplaceTypes: [],
    minSalary: null,
    employmentTypes: [],
    experienceLevel: null,
    preferredIndustries: [],
    excludedCompanies: [],
    requiredKeywords: [],
    excludedKeywords: [],
    sponsorshipRequired: false,
    maxPostingAgeDays: null,
    searchFrequency: "DAILY",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as SearchProfile;
}

describe("applyHardFilters", () => {
  it("returns no failures when profile is null", () => {
    expect(applyHardFilters(makeJob(), null)).toEqual({ failures: [] });
  });

  it("returns no failures when nothing in the profile conflicts", () => {
    const result = applyHardFilters(makeJob(), makeProfile());
    expect(result.failures).toHaveLength(0);
  });

  it("fails on a location mismatch", () => {
    const result = applyHardFilters(makeJob(), makeProfile({ locations: ["Seattle, WA"] }));
    expect(result.failures.some((f) => f.startsWith("Location"))).toBe(true);
  });

  it("does not fail location when the profile has no location preference", () => {
    const result = applyHardFilters(makeJob(), makeProfile({ locations: [] }));
    expect(result.failures.some((f) => f.startsWith("Location"))).toBe(false);
  });

  it("does not fail location when the job has no location listed", () => {
    const result = applyHardFilters(
      makeJob({ location: null }),
      makeProfile({ locations: ["Seattle, WA"] })
    );
    expect(result.failures.some((f) => f.startsWith("Location"))).toBe(false);
  });

  it("fails on a workplace type mismatch", () => {
    const result = applyHardFilters(makeJob(), makeProfile({ workplaceTypes: ["REMOTE"] }));
    expect(result.failures.some((f) => f.startsWith("Workplace type"))).toBe(true);
  });

  it("fails on a salary below the profile's minimum", () => {
    const result = applyHardFilters(
      makeJob({ salaryMin: 80000, salaryMax: 90000 }),
      makeProfile({ minSalary: 120000 })
    );
    expect(result.failures.some((f) => f.startsWith("Salary"))).toBe(true);
  });

  it("does not fail salary when the job has no salary listed", () => {
    const result = applyHardFilters(
      makeJob({ salaryMin: null, salaryMax: null }),
      makeProfile({ minSalary: 120000 })
    );
    expect(result.failures.some((f) => f.startsWith("Salary"))).toBe(false);
  });

  it("fails on an excluded company", () => {
    const result = applyHardFilters(
      makeJob({ company: "Bad Co" }),
      makeProfile({ excludedCompanies: ["Bad Co"] })
    );
    expect(result.failures.some((f) => f.startsWith("Company"))).toBe(true);
  });

  it("fails when a posting is older than the max age", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const result = applyHardFilters(
      makeJob({ datePosted: tenDaysAgo }),
      makeProfile({ maxPostingAgeDays: 5 })
    );
    expect(result.failures.some((f) => f.startsWith("Posting age"))).toBe(true);
  });

  it("does not fail experience level on mere silence", () => {
    const result = applyHardFilters(
      makeJob({ title: "Engineer", experienceRequirements: null }),
      makeProfile({ experienceLevel: "ENTRY" })
    );
    expect(result.failures.some((f) => f.startsWith("Experience level"))).toBe(false);
  });

  it("fails experience level only on a clear contradiction", () => {
    const result = applyHardFilters(
      makeJob({ title: "Senior Engineer" }),
      makeProfile({ experienceLevel: "ENTRY" })
    );
    expect(result.failures.some((f) => f.startsWith("Experience level"))).toBe(true);
  });

  it("fails sponsorship only on a clear contradiction", () => {
    const result = applyHardFilters(
      makeJob({ sponsorshipInfo: "We are unable to sponsor visas at this time." }),
      makeProfile({ sponsorshipRequired: true })
    );
    expect(result.failures.some((f) => f.startsWith("Sponsorship"))).toBe(true);
  });

  it("does not fail sponsorship when nothing is mentioned", () => {
    const result = applyHardFilters(makeJob(), makeProfile({ sponsorshipRequired: true }));
    expect(result.failures.some((f) => f.startsWith("Sponsorship"))).toBe(false);
  });

  it("collects multiple simultaneous failures", () => {
    const result = applyHardFilters(
      makeJob({ company: "Bad Co", location: "Chicago, IL" }),
      makeProfile({ excludedCompanies: ["Bad Co"], locations: ["Seattle, WA"] })
    );
    expect(result.failures.length).toBeGreaterThanOrEqual(2);
  });
});

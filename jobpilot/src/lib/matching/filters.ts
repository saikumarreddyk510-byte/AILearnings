import type { Job, SearchProfile } from "@/generated/prisma/client";
import { toStringArray } from "@/lib/matching/json-utils";

export interface HardFilterResult {
  /** Human-readable, ready to render directly — never gates access to the job. */
  failures: string[];
}

const EXPERIENCE_CONTRADICTIONS: Record<string, string[]> = {
  ENTRY: ["senior", "principal", "staff", "director", "10+ years", "8+ years"],
  MID: ["principal", "staff", "director", "entry level", "entry-level", "new grad"],
  SENIOR: ["entry level", "entry-level", "new grad", "internship", "intern"],
  LEAD: ["entry level", "entry-level", "new grad", "internship", "intern"],
  EXECUTIVE: ["entry level", "entry-level", "new grad", "internship", "intern"],
};

const SPONSORSHIP_CONTRADICTIONS = [
  "no sponsorship",
  "not able to sponsor",
  "unable to sponsor",
  "cannot sponsor",
  "without sponsorship",
  "must be authorized to work",
];

/**
 * Deterministic, transparent hard filters (spec section E). `profile: null`
 * skips filtering entirely (there's nothing to filter against). Every
 * criterion is *fail-open*: absent/unstructured data on either side never
 * counts as a failure — a filter only fires on a clear, structured (or, for
 * the two heuristic criteria, clearly-worded) contradiction. This keeps the
 * job fully visible either way (spec: "Do not hide a job merely because the
 * AI score is low. Let the user inspect rejected and filtered jobs.") —
 * `failures` is informational, not an access gate.
 */
export function applyHardFilters(
  job: Job,
  profile: SearchProfile | null
): HardFilterResult {
  if (!profile) return { failures: [] };

  const failures: string[] = [];

  const locations = toStringArray(profile.locations);
  if (locations.length > 0 && job.location) {
    const jobLocation = job.location.toLowerCase();
    const matches = locations.some(
      (loc) => jobLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLocation)
    );
    if (!matches) {
      failures.push(
        `Location: profile wants one of [${locations.join(", ")}] but job is in ${job.location}.`
      );
    }
  }

  const workplaceTypes = toStringArray(profile.workplaceTypes);
  if (workplaceTypes.length > 0 && job.workplaceType && !workplaceTypes.includes(job.workplaceType)) {
    failures.push(
      `Workplace type: profile wants [${workplaceTypes.join(", ")}] but job is ${job.workplaceType}.`
    );
  }

  const employmentTypes = toStringArray(profile.employmentTypes);
  if (
    employmentTypes.length > 0 &&
    job.employmentType &&
    !employmentTypes.includes(job.employmentType)
  ) {
    failures.push(
      `Employment type: profile wants [${employmentTypes.join(", ")}] but job is ${job.employmentType}.`
    );
  }

  const jobFloor = job.salaryMax ?? job.salaryMin;
  if (profile.minSalary != null && jobFloor != null && jobFloor < profile.minSalary) {
    failures.push(
      `Salary: profile wants at least ${profile.minSalary} but job tops out at ${jobFloor}.`
    );
  }

  const excludedCompanies = toStringArray(profile.excludedCompanies);
  if (excludedCompanies.length > 0) {
    const jobCompany = job.company.toLowerCase();
    const excluded = excludedCompanies.some(
      (name) => jobCompany.includes(name.toLowerCase()) || name.toLowerCase().includes(jobCompany)
    );
    if (excluded) {
      failures.push(`Company: "${job.company}" is on your excluded companies list.`);
    }
  }

  if (profile.maxPostingAgeDays != null) {
    const referenceDate = job.datePosted ?? job.dateDiscovered;
    const ageDays = Math.floor((Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    if (ageDays > profile.maxPostingAgeDays) {
      failures.push(
        `Posting age: job is ${ageDays} day(s) old, older than the ${profile.maxPostingAgeDays}-day limit.`
      );
    }
  }

  if (profile.experienceLevel) {
    const haystack = `${job.title} ${job.experienceRequirements ?? ""}`.toLowerCase();
    const contradictions = EXPERIENCE_CONTRADICTIONS[profile.experienceLevel] ?? [];
    const hit = contradictions.find((phrase) => haystack.includes(phrase));
    if (hit) {
      failures.push(
        `Experience level (heuristic, low confidence): job text mentions "${hit}", which contradicts your profile's ${profile.experienceLevel} target.`
      );
    }
  }

  if (profile.sponsorshipRequired) {
    const haystack = `${job.sponsorshipInfo ?? ""} ${job.description}`.toLowerCase();
    const hit = SPONSORSHIP_CONTRADICTIONS.find((phrase) => haystack.includes(phrase));
    if (hit) {
      failures.push(
        `Sponsorship (heuristic, low confidence): job text says "${hit}", but your profile requires sponsorship.`
      );
    }
  }

  return { failures };
}

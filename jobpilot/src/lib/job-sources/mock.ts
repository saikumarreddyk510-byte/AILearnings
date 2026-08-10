import type {
  JobSearchCriteria,
  JobSource,
  NormalizedJobResult,
} from "@/lib/job-sources/types";

const FIXTURE_JOBS: NormalizedJobResult[] = [
  {
    sourceJobId: "mock-001",
    sourceUrl: "https://example.com/jobs/mock-001",
    applicationUrl: "https://example.com/jobs/mock-001/apply",
    company: "Northwind Analytics",
    title: "Senior Frontend Engineer",
    description:
      "Build and maintain customer-facing dashboards using React and TypeScript. 5+ years experience required.",
    location: "Austin, TX",
    workplaceType: "HYBRID",
    datePosted: "2026-07-15",
  },
  {
    sourceJobId: "mock-002",
    sourceUrl: "https://example.com/jobs/mock-002",
    applicationUrl: "https://example.com/jobs/mock-002/apply",
    company: "Riverbank Data Co.",
    title: "Backend Engineer, Platform",
    description:
      "Design and operate distributed services in Go and PostgreSQL. Experience with Kubernetes preferred.",
    location: "Remote",
    workplaceType: "REMOTE",
    datePosted: "2026-08-01",
  },
  {
    sourceJobId: "mock-003",
    sourceUrl: "https://example.com/jobs/mock-003",
    applicationUrl: "https://example.com/jobs/mock-003/apply",
    company: "Lakeside Robotics",
    title: "Full-Stack Developer",
    description:
      "Work across a Next.js frontend and a Python/FastAPI backend for internal tooling.",
    location: "Chicago, IL",
    workplaceType: "ON_SITE",
    datePosted: "2026-08-05",
  },
];

/** Fully-implemented, deterministic JobSource used for local dev/tests. */
export class MockJobSource implements JobSource {
  readonly sourceType = "MOCK";

  async searchJobs(criteria: JobSearchCriteria): Promise<NormalizedJobResult[]> {
    const wantedTitles = criteria.roleTitles.map((t) => t.toLowerCase());
    if (wantedTitles.length === 0) return FIXTURE_JOBS;

    return FIXTURE_JOBS.filter((job) =>
      wantedTitles.some((title) => job.title.toLowerCase().includes(title))
    );
  }

  async getJobDetails(sourceJobId: string): Promise<NormalizedJobResult | null> {
    return FIXTURE_JOBS.find((job) => job.sourceJobId === sourceJobId) ?? null;
  }

  async getApplicationUrl(sourceJobId: string): Promise<string | null> {
    const job = await this.getJobDetails(sourceJobId);
    return job?.applicationUrl ?? null;
  }

  supportsApplicationSubmission(): boolean {
    // No source has an approved submission API in Phase 1 — every job
    // routes to "open the official application page" per spec section H.
    return false;
  }
}

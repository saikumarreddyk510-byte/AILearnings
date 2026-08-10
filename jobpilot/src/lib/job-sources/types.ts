/**
 * The JobSource interface named in the spec (section C: Job ingestion).
 * Full ingestion (search, dedup, scheduling) is Phase 3 work — Phase 1 only
 * establishes this contract plus a working mock implementation, so future
 * adapters (manual URL/paste, CSV import, a permitted job API) have an
 * obvious, consistent shape to implement against.
 */

export interface JobSearchCriteria {
  roleTitles: string[];
  locations?: string[];
  workplaceTypes?: ("REMOTE" | "HYBRID" | "ON_SITE")[];
  maxPostingAgeDays?: number;
}

export interface NormalizedJobResult {
  sourceJobId: string;
  sourceUrl: string;
  applicationUrl?: string;
  company: string;
  title: string;
  description: string;
  location?: string;
  workplaceType?: "REMOTE" | "HYBRID" | "ON_SITE";
  datePosted?: string;
}

export interface JobSource {
  readonly sourceType: string;
  searchJobs(criteria: JobSearchCriteria): Promise<NormalizedJobResult[]>;
  getJobDetails(sourceJobId: string): Promise<NormalizedJobResult | null>;
  getApplicationUrl(sourceJobId: string): Promise<string | null>;
  supportsApplicationSubmission(): boolean;
}

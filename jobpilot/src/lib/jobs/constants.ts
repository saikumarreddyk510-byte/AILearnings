import { env } from "@/lib/env";

export const JOB_CSV_MAX_UPLOAD_BYTES = env.JOB_CSV_MAX_UPLOAD_BYTES;
export const JOB_CSV_MAX_ROWS = env.JOB_CSV_MAX_ROWS;

/** Documented column schema for /jobs/import — also rendered as on-page docs. */
export const JOB_CSV_COLUMNS = [
  { header: "title", required: true, description: "Job title" },
  { header: "company", required: true, description: "Company name" },
  { header: "description", required: true, description: "Full job description" },
  { header: "source_url", required: true, description: "Original posting URL (never fetched)" },
  { header: "application_url", required: false, description: "Where to apply" },
  { header: "location", required: false, description: "e.g. \"Austin, TX\" or \"Remote\"" },
  { header: "workplace_type", required: false, description: "REMOTE, HYBRID, or ON_SITE" },
  {
    header: "employment_type",
    required: false,
    description: "FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, or TEMPORARY",
  },
  { header: "salary_min", required: false, description: "Integer" },
  { header: "salary_max", required: false, description: "Integer" },
  {
    header: "required_skills",
    required: false,
    description: "Semicolon-separated, e.g. \"React;TypeScript\"",
  },
  { header: "preferred_skills", required: false, description: "Semicolon-separated" },
  { header: "date_posted", required: false, description: "YYYY-MM-DD" },
] as const;

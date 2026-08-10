import { z } from "zod";
import {
  EmploymentTypeSchema,
  ExperienceLevelSchema,
  SearchFrequencySchema,
  WorkplaceTypeSchema,
} from "@/lib/enums";

/**
 * Shared between server actions and client forms, mirroring
 * src/lib/resume/fact-schemas.ts's style. These validate *shape/presence*
 * only — normalizeJobInput (src/lib/jobs/normalize.ts) is what turns valid
 * input into clean NormalizedJobFields.
 */

export const ManualJobEntrySchema = z.object({
  entryMode: z.enum(["MANUAL_URL", "MANUAL_PASTE"]),
  sourceUrl: z.string().url("Enter a valid URL."),
  company: z.string().min(1, "Company is required."),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().optional(),
  workplaceType: WorkplaceTypeSchema.optional().or(z.literal("")),
  employmentType: EmploymentTypeSchema.optional().or(z.literal("")),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  preferredSkills: z.array(z.string()).optional(),
});
export type ManualJobEntryInput = z.infer<typeof ManualJobEntrySchema>;

/** One CSV row, pre-normalization — every cell arrives as a raw string. */
export const CsvJobRowSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  source_url: z.string().min(1),
  application_url: z.string().optional(),
  location: z.string().optional(),
  workplace_type: z.string().optional(),
  employment_type: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  required_skills: z.string().optional(),
  preferred_skills: z.string().optional(),
  date_posted: z.string().optional(),
});
export type CsvJobRow = z.infer<typeof CsvJobRowSchema>;

export const SearchProfileInputSchema = z.object({
  name: z.string().min(1, "Give this search profile a name."),
  targetRoleTitles: z.array(z.string().min(1)).min(1, "Add at least one target role title."),
  alternateRoleTitles: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  optionalSkills: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  workplaceTypes: z.array(WorkplaceTypeSchema).default([]),
  minSalary: z.number().int().positive().optional(),
  employmentTypes: z.array(EmploymentTypeSchema).default([]),
  experienceLevel: ExperienceLevelSchema.optional(),
  preferredIndustries: z.array(z.string()).default([]),
  excludedCompanies: z.array(z.string()).default([]),
  requiredKeywords: z.array(z.string()).default([]),
  excludedKeywords: z.array(z.string()).default([]),
  sponsorshipRequired: z.boolean().default(false),
  maxPostingAgeDays: z.number().int().positive().optional(),
  searchFrequency: SearchFrequencySchema.default("DAILY"),
});
export type SearchProfileInput = z.infer<typeof SearchProfileInputSchema>;

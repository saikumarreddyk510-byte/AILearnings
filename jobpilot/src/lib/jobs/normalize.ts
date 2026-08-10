import { z } from "zod";
import {
  EmploymentTypeSchema,
  WorkplaceTypeSchema,
  type EmploymentType,
  type WorkplaceType,
} from "@/lib/enums";
import { computeContentFingerprint } from "@/lib/jobs/fingerprint";

/**
 * Loosely-typed input shared by every ingestion path (manual form, CSV row,
 * mock-catalog seed). Enum-ish fields are raw strings here — normalization
 * is responsible for validating them, and does so leniently (bad/blank
 * values become `undefined` rather than throwing), since a single messy
 * CSV cell must never fail an entire row.
 */
export interface RawJobInput {
  company: string;
  title: string;
  description: string;
  sourceUrl: string;
  applicationUrl?: string | null;
  location?: string | null;
  workplaceType?: string | null;
  employmentType?: string | null;
  salaryMin?: string | number | null;
  salaryMax?: string | number | null;
  requiredSkills?: string[] | null;
  preferredSkills?: string[] | null;
  datePosted?: string | null;
}

export interface NormalizedJobFields {
  company: string;
  title: string;
  description: string;
  sourceUrl: string;
  applicationUrl?: string;
  location?: string;
  workplaceType?: WorkplaceType;
  employmentType?: EmploymentType;
  salaryMin?: number;
  salaryMax?: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  datePosted?: Date;
  contentFingerprint: string;
}

function cleanString(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseEnum<T extends string>(
  schema: z.ZodType<T>,
  value: string | null | undefined
): T | undefined {
  const cleaned = cleanString(value);
  if (!cleaned) return undefined;
  const result = schema.safeParse(cleaned.toUpperCase());
  return result.success ? result.data : undefined;
}

function parseSalary(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : undefined;
}

function parseDate(value: string | null | undefined): Date | undefined {
  const cleaned = cleanString(value);
  if (!cleaned) return undefined;
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The single place that decides what "clean" job data looks like. */
export function normalizeJobInput(raw: RawJobInput): NormalizedJobFields {
  const company = raw.company.trim();
  const title = raw.title.trim();
  const description = raw.description.trim();

  let salaryMin = parseSalary(raw.salaryMin);
  let salaryMax = parseSalary(raw.salaryMax);
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
    [salaryMin, salaryMax] = [salaryMax, salaryMin];
  }

  return {
    company,
    title,
    description,
    sourceUrl: raw.sourceUrl.trim(),
    applicationUrl: cleanString(raw.applicationUrl),
    location: cleanString(raw.location),
    workplaceType: parseEnum(WorkplaceTypeSchema, raw.workplaceType),
    employmentType: parseEnum(EmploymentTypeSchema, raw.employmentType),
    salaryMin,
    salaryMax,
    requiredSkills: raw.requiredSkills?.map((s) => s.trim()).filter(Boolean),
    preferredSkills: raw.preferredSkills?.map((s) => s.trim()).filter(Boolean),
    datePosted: parseDate(raw.datePosted),
    contentFingerprint: computeContentFingerprint({ company, title, description }),
  };
}

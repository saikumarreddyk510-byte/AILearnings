import { z } from "zod";

/**
 * SQLite (our local dev datasource) has no native `enum` type support in
 * Prisma, so every enum-like column in prisma/schema.prisma is a plain
 * `String`. These Zod enums are the single source of truth for the allowed
 * values — every read/write path that touches one of these columns should
 * parse through the matching schema below instead of trusting the raw
 * string. Moving to Postgres later can introduce native `enum` columns
 * without changing any call site, since the contract here stays identical.
 */

// ── Application lifecycle (spec section G: Human-review workflow) ──
export const APPLICATION_STATUSES = [
  "DRAFT",
  "ANALYZED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "READY_TO_APPLY",
  "SUBMISSION_CONFIRMED",
  "APPLIED",
  "REJECTED",
  "INTERVIEW",
  "OFFER",
  "WITHDRAWN",
] as const;
export const ApplicationStatusSchema = z.enum(APPLICATION_STATUSES);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

// ── Résumé ──
export const RESUME_STATUSES = [
  "UPLOADED",
  "EXTRACTING",
  "NEEDS_REVIEW",
  "VERIFIED",
] as const;
export const ResumeStatusSchema = z.enum(RESUME_STATUSES);
export type ResumeStatus = z.infer<typeof ResumeStatusSchema>;

export const RESUME_FACT_TYPES = [
  "CONTACT",
  "SUMMARY",
  "SKILL",
  "WORK_HISTORY",
  "PROJECT",
  "EDUCATION",
  "CERTIFICATION",
] as const;
export const ResumeFactTypeSchema = z.enum(RESUME_FACT_TYPES);
export type ResumeFactType = z.infer<typeof ResumeFactTypeSchema>;

// ── Search profile ──
export const WORKPLACE_TYPES = ["REMOTE", "HYBRID", "ON_SITE"] as const;
export const WorkplaceTypeSchema = z.enum(WORKPLACE_TYPES);
export type WorkplaceType = z.infer<typeof WorkplaceTypeSchema>;

export const SEARCH_FREQUENCIES = ["DAILY", "WEEKLY", "MANUAL"] as const;
export const SearchFrequencySchema = z.enum(SEARCH_FREQUENCIES);
export type SearchFrequency = z.infer<typeof SearchFrequencySchema>;

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
] as const;
export const EmploymentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const EXPERIENCE_LEVELS = [
  "ENTRY",
  "MID",
  "SENIOR",
  "LEAD",
  "EXECUTIVE",
] as const;
export const ExperienceLevelSchema = z.enum(EXPERIENCE_LEVELS);
export type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;

// ── Job ingestion (spec section C: JobSource interface) ──
export const JOB_SOURCE_TYPES = [
  "MOCK",
  "MANUAL_URL",
  "MANUAL_PASTE",
  "CSV_IMPORT",
  "EMAIL",
] as const;
export const JobSourceTypeSchema = z.enum(JOB_SOURCE_TYPES);
export type JobSourceType = z.infer<typeof JobSourceTypeSchema>;

export const JOB_REQUIREMENT_TYPES = [
  "SKILL",
  "EDUCATION",
  "EXPERIENCE",
  "CERTIFICATION",
] as const;
export const JobRequirementTypeSchema = z.enum(JOB_REQUIREMENT_TYPES);
export type JobRequirementType = z.infer<typeof JobRequirementTypeSchema>;

// ── Review workflow ──
export const REVIEW_DECISION_TYPES = ["ACCEPTED", "REJECTED", "EDITED"] as const;
export const ReviewDecisionTypeSchema = z.enum(REVIEW_DECISION_TYPES);
export type ReviewDecisionType = z.infer<typeof ReviewDecisionTypeSchema>;

// ── AI execution (spec section J: AI safety and quality) ──
export const AI_EXECUTION_PURPOSES = [
  "MATCH_ANALYSIS",
  "RESUME_TAILORING",
  "COVER_LETTER",
] as const;
export const AIExecutionPurposeSchema = z.enum(AI_EXECUTION_PURPOSES);
export type AIExecutionPurpose = z.infer<typeof AIExecutionPurposeSchema>;

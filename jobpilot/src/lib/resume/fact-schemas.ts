import { z } from "zod";
import { RESUME_FACT_TYPES, type ResumeFactType } from "@/lib/enums";

/**
 * Per-ResumeFactType content shapes. Shared by server-side validation
 * (src/server/data/resumes.ts) and the client fact editor, so both sides
 * agree on what a valid fact looks like. `content` in ResumeFact is stored
 * as structured Json — never pre-rendered markup — per the spec's "keep
 * content and formatting templates separate" requirement.
 */
export const ContactContentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z
    .array(z.object({ label: z.string().min(1), url: z.string().url() }))
    .default([]),
});

export const SummaryContentSchema = z.object({
  text: z.string().min(1),
});

export const SkillContentSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
});

export const WorkHistoryContentSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  bullets: z.array(z.string().min(1)).default([]),
});

export const ProjectContentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional(),
  bullets: z.array(z.string().min(1)).default([]),
  technologies: z.array(z.string().min(1)).default([]),
});

export const EducationContentSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});

export const CertificationContentSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
  credentialId: z.string().optional(),
  url: z.string().url().optional(),
});

export const ResumeFactContentSchemaByType = {
  CONTACT: ContactContentSchema,
  SUMMARY: SummaryContentSchema,
  SKILL: SkillContentSchema,
  WORK_HISTORY: WorkHistoryContentSchema,
  PROJECT: ProjectContentSchema,
  EDUCATION: EducationContentSchema,
  CERTIFICATION: CertificationContentSchema,
} satisfies Record<ResumeFactType, z.ZodType>;

// Sanity check, at module load, that every RESUME_FACT_TYPES entry has a
// matching schema — catches drift if enums.ts ever adds a type without a
// content shape defined here.
for (const type of RESUME_FACT_TYPES) {
  if (!(type in ResumeFactContentSchemaByType)) {
    throw new Error(`Missing ResumeFactContentSchemaByType entry for "${type}"`);
  }
}

/** A fact as accepted by replaceResumeFactsForUser — validated per-type below. */
export const ResumeFactInputSchema = z.object({
  id: z.string().optional(), // absent => create; present => update-or-locked-noop
  type: z.enum(RESUME_FACT_TYPES),
  content: z.unknown(),
  verified: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
export type ResumeFactInput = z.infer<typeof ResumeFactInputSchema>;

/** Validates `content` against the schema matching `type`. Throws on mismatch. */
export function parseFactContent(type: ResumeFactType, content: unknown) {
  return ResumeFactContentSchemaByType[type].parse(content);
}

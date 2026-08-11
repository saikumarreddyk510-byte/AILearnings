import { z } from "zod";
import { TrackedOutcomeStatusSchema } from "@/lib/enums";

/**
 * Shared shape/presence validation for the application-tracking server
 * actions, mirroring src/lib/jobs/schemas.ts's style. Validated in
 * src/server/actions/applications.ts before anything reaches
 * src/server/data/applications.ts.
 */

export const ConfirmSubmissionInputSchema = z.object({
  dateApplied: z.coerce.date(),
});
export type ConfirmSubmissionInput = z.infer<typeof ConfirmSubmissionInputSchema>;

export const RecordOutcomeInputSchema = z.object({
  toStatus: TrackedOutcomeStatusSchema,
  message: z.string().max(2000).optional(),
});
export type RecordOutcomeInput = z.infer<typeof RecordOutcomeInputSchema>;

export const ContactInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const InterviewDateSchema = z.object({
  date: z.string().min(1),
  note: z.string().optional(),
});

export const UpdateApplicationDetailsInputSchema = z.object({
  notes: z.string().max(5000).optional(),
  followUpDate: z.coerce.date().optional().nullable(),
  contactInfo: ContactInfoSchema.optional(),
  interviewDates: z.array(InterviewDateSchema).optional(),
});
export type UpdateApplicationDetailsInput = z.infer<typeof UpdateApplicationDetailsInputSchema>;

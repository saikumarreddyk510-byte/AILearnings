"use server";

import { requireUserId } from "@/server/auth/session";
import {
  getOrCreateApplicationForUser,
  confirmApplicationSubmissionForUser,
  recordApplicationOutcomeForUser,
  updateApplicationDetailsForUser,
} from "@/server/data/applications";
import {
  ConfirmSubmissionInputSchema,
  RecordOutcomeInputSchema,
  UpdateApplicationDetailsInputSchema,
} from "@/lib/applications/schemas";

export async function startApplicationAction(jobId: string) {
  const userId = await requireUserId();
  return getOrCreateApplicationForUser(userId, jobId);
}

export async function confirmApplicationSubmissionAction(applicationId: string, dateApplied: string) {
  const userId = await requireUserId();
  const parsed = ConfirmSubmissionInputSchema.safeParse({ dateApplied });
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" as const };
  return confirmApplicationSubmissionForUser(applicationId, userId, parsed.data.dateApplied);
}

export async function recordApplicationOutcomeAction(
  applicationId: string,
  toStatus: string,
  message?: string
) {
  const userId = await requireUserId();
  const parsed = RecordOutcomeInputSchema.safeParse({ toStatus, message });
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" as const };
  return recordApplicationOutcomeForUser(
    applicationId,
    userId,
    parsed.data.toStatus,
    parsed.data.message
  );
}

export async function updateApplicationDetailsAction(
  applicationId: string,
  details: {
    notes?: string;
    followUpDate?: string | null;
    contactInfo?: { name?: string; email?: string; phone?: string };
    interviewDates?: { date: string; note?: string }[];
  }
) {
  const userId = await requireUserId();
  const parsed = UpdateApplicationDetailsInputSchema.safeParse(details);
  if (!parsed.success) return false;
  return updateApplicationDetailsForUser(applicationId, userId, parsed.data);
}

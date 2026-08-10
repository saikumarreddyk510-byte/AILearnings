import { env } from "@/lib/env";

export const RESUME_MAX_UPLOAD_BYTES = env.RESUME_MAX_UPLOAD_BYTES;

export const ACCEPTED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AcceptedResumeMimeType = (typeof ACCEPTED_RESUME_MIME_TYPES)[number];

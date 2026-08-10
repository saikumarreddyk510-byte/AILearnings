import "server-only";
import {
  ACCEPTED_RESUME_MIME_TYPES,
  RESUME_MAX_UPLOAD_BYTES,
  type AcceptedResumeMimeType,
} from "@/lib/resume/constants";
import { sniffFileKind } from "@/lib/resume/file-signature";

export type ValidateResumeUploadResult =
  | { ok: true; buffer: Buffer; mimeType: AcceptedResumeMimeType }
  | { ok: false; error: string };

const KIND_TO_MIME: Record<"pdf" | "docx", AcceptedResumeMimeType> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * Validates an uploaded résumé file: size, declared MIME type, and — the
 * part that actually matters — real file-signature bytes, never trusting
 * `file.type` alone (a client can set that to anything). Cheapest checks
 * run first so we never read a too-large file into memory just to reject it.
 */
export async function validateResumeUpload(
  file: File
): Promise<ValidateResumeUploadResult> {
  if (file.size === 0) {
    return { ok: false, error: "The selected file is empty." };
  }

  if (file.size > RESUME_MAX_UPLOAD_BYTES) {
    const limitMb = (RESUME_MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `File exceeds the ${limitMb}MB limit.` };
  }

  if (!ACCEPTED_RESUME_MIME_TYPES.includes(file.type as AcceptedResumeMimeType)) {
    return { ok: false, error: "Only PDF and DOCX files are supported." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = await sniffFileKind(buffer);

  if (kind === "unknown" || KIND_TO_MIME[kind] !== file.type) {
    return {
      ok: false,
      error: "File content doesn't match its declared type.",
    };
  }

  return { ok: true, buffer, mimeType: KIND_TO_MIME[kind] };
}

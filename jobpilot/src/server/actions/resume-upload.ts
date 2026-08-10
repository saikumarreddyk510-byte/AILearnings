"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { validateResumeUpload } from "@/lib/resume/validate-upload";
import { extractTextFromPdf } from "@/lib/resume/pdf";
import { extractTextFromDocx } from "@/lib/resume/docx";
import { sanitizeExtractedText } from "@/lib/resume/sanitize";
import { deriveContactFromText } from "@/lib/resume/heuristics";
import {
  createMasterResumeForUser,
  replaceResumeFactsForUser,
  saveExtractionResultForUser,
  setResumeStatusForUser,
} from "@/server/data/resumes";

export type UploadResumeFormState =
  | { errors?: { file?: string[] }; message?: string }
  | undefined;

export async function uploadResumeAction(
  _prevState: UploadResumeFormState,
  formData: FormData
): Promise<UploadResumeFormState> {
  const userId = await requireUserId();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { errors: { file: ["Please choose a file to upload."] } };
  }

  const validated = await validateResumeUpload(file);
  if (!validated.ok) {
    return { errors: { file: [validated.error] } };
  }

  const resume = await createMasterResumeForUser(userId, {
    originalFileName: file.name,
    originalMimeType: validated.mimeType,
    originalFileData: validated.buffer,
  });

  await setResumeStatusForUser(resume.id, userId, "EXTRACTING");

  let rawText = "";
  try {
    rawText =
      validated.mimeType === "application/pdf"
        ? await extractTextFromPdf(validated.buffer)
        : await extractTextFromDocx(validated.buffer);
  } catch {
    // Extraction failure still lands in NEEDS_REVIEW with empty text —
    // the user can build facts from scratch instead of being stuck.
    rawText = "";
  }

  const extractedText = sanitizeExtractedText(rawText);
  await saveExtractionResultForUser(resume.id, userId, extractedText);

  // Best-effort starting point, never presented as confirmed — the CONTACT
  // fact is created unverified and the user must review/verify it.
  const contact = deriveContactFromText(extractedText);
  if (contact.email || contact.phone) {
    await replaceResumeFactsForUser(resume.id, userId, [
      {
        type: "CONTACT",
        content: {
          name: file.name.replace(/\.(pdf|docx)$/i, "") || "Untitled",
          ...contact,
          links: [],
        },
        verified: false,
        sortOrder: 0,
      },
    ]);
  }

  redirect(`/resume/${resume.id}`);
}

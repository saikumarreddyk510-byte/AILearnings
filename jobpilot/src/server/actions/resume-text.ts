"use server";

import { requireUserId } from "@/server/auth/session";
import { updateExtractedTextForUser } from "@/server/data/resumes";
import { sanitizeExtractedText } from "@/lib/resume/sanitize";

export type UpdateExtractedTextFormState = { message?: string } | undefined;

/**
 * Bound with the résumé id on the client (`updateExtractedTextAction.bind(null, id)`)
 * before being passed to useActionState, since useActionState actions take
 * only (prevState, formData).
 */
export async function updateExtractedTextAction(
  masterResumeId: string,
  _prevState: UpdateExtractedTextFormState,
  formData: FormData
): Promise<UpdateExtractedTextFormState> {
  const userId = await requireUserId();

  const raw = formData.get("extractedText");
  if (typeof raw !== "string") {
    return { message: "Invalid text." };
  }

  const ok = await updateExtractedTextForUser(
    masterResumeId,
    userId,
    sanitizeExtractedText(raw)
  );
  if (!ok) {
    return { message: "Résumé not found." };
  }

  return { message: "Saved." };
}

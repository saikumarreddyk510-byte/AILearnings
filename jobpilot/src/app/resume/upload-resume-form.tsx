"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadResumeAction } from "@/server/actions/resume-upload";

export function UploadResumeForm() {
  const [state, action, pending] = useActionState(uploadResumeAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">Résumé (PDF or DOCX, up to 5MB)</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.docx"
          required
          className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {state?.errors?.file && (
          <p className="text-sm text-destructive">{state.errors.file[0]}</p>
        )}
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Uploading…" : "Upload résumé"}
      </Button>
    </form>
  );
}

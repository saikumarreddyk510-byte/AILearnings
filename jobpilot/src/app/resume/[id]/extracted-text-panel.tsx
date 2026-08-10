"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateExtractedTextAction } from "@/server/actions/resume-text";

export function ExtractedTextPanel({
  masterResumeId,
  extractedText,
}: {
  masterResumeId: string;
  extractedText: string | null;
}) {
  const boundAction = updateExtractedTextAction.bind(null, masterResumeId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <Textarea
        name="extractedText"
        aria-label="Extracted text"
        defaultValue={extractedText ?? ""}
        rows={10}
        placeholder="No text could be extracted automatically — you can still build facts manually below."
        className="font-mono text-xs"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" disabled={pending} className="w-fit">
          {pending ? "Saving…" : "Save corrected text"}
        </Button>
        {state?.message && (
          <span className="text-sm text-muted-foreground">{state.message}</span>
        )}
      </div>
    </form>
  );
}

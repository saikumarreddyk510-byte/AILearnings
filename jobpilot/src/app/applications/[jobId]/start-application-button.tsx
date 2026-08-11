"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startApplicationAction } from "@/server/actions/applications";

const ERROR_LABEL: Record<string, string> = {
  JOB_NOT_FOUND: "This job could not be found.",
  NO_JOB_MATCH: "Run a match analysis on this job before applying.",
  NO_APPROVED_TAILORED_RESUME: "Approve a tailored résumé for this job before applying.",
};

export function StartApplicationButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await startApplicationAction(jobId);
      if (!result.ok) {
        setError(ERROR_LABEL[result.error] ?? "Could not start this application.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Starting…" : "Start application"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

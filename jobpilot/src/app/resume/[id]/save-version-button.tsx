"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createResumeVersionAction } from "@/server/actions/resume-version";

export function SaveVersionButton({
  masterResumeId,
  disabledReason,
}: {
  masterResumeId: string;
  disabledReason: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createResumeVersionAction(masterResumeId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={isPending || Boolean(disabledReason)}
        title={disabledReason ?? undefined}
      >
        {isPending ? "Saving version…" : "Save as new version"}
      </Button>
      {disabledReason && (
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

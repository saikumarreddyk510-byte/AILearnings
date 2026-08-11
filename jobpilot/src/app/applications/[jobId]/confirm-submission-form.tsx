"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmApplicationSubmissionAction } from "@/server/actions/applications";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The single "READY_TO_APPLY -> APPLIED" control (spec's one hard rule: no
 * automatic transition, ever). Never claims submission before the action
 * resolves ok:true — an ALREADY_SUBMITTED response (e.g. a stale second
 * tab) renders the already-submitted state instead of an error, since
 * nothing was actually lost.
 */
export function ConfirmSubmissionForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [dateApplied, setDateApplied] = useState(todayIsoDate());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmApplicationSubmissionAction(applicationId, dateApplied);
      if (!result.ok) {
        if (result.error === "ALREADY_SUBMITTED") {
          router.refresh();
          return;
        }
        setError("Could not confirm this submission — please try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Only confirm this after you&apos;ve actually submitted the application on the
        official page above.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dateApplied">Date submitted</Label>
          <Input
            id="dateApplied"
            type="date"
            value={dateApplied}
            onChange={(e) => setDateApplied(e.target.value)}
          />
        </div>
        <Button onClick={handleConfirm} disabled={isPending}>
          {isPending ? "Confirming…" : "Confirm submission"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

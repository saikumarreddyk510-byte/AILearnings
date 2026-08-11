"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRACKED_OUTCOME_STATUSES } from "@/lib/enums";
import { recordApplicationOutcomeAction } from "@/server/actions/applications";

/**
 * Post-APPLIED outcome picker. Deliberately only offers
 * REJECTED/INTERVIEW/OFFER/WITHDRAWN — READY_TO_APPLY cards never render
 * this control at all (that transition only happens via the dedicated
 * confirm-submission page), so there is no way to select APPLIED here.
 */
export function ApplicationStatusSelect({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      await recordApplicationOutcomeAction(applicationId, value);
      router.refresh();
    });
  }

  return (
    <Select value={currentStatus} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={currentStatus}>{currentStatus}</SelectItem>
        {TRACKED_OUTCOME_STATUSES.filter((s) => s !== currentStatus).map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

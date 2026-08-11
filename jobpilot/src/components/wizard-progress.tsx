import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  label: string;
  href: string;
  status: "done" | "current" | "upcoming";
}

/**
 * Shared, presentational step-bar shown across the per-job flow
 * (add job -> analyze -> tailor & review -> approve -> apply). Every page
 * computes its own step list server-side (from data it's already fetching)
 * and passes it down — this component does no data fetching of its own.
 * "upcoming" steps render as plain text, not a link, so a user can't jump
 * ahead to a page that would just bounce them back (e.g. tailoring before
 * a match exists).
 */
export function WizardProgress({ steps }: { steps: WizardStep[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm">
      {steps.map((step, index) => (
        <li key={step.label} className="flex items-center gap-2">
          {index > 0 && <span className="text-muted-foreground">→</span>}
          <StepBadge step={step} />
        </li>
      ))}
    </ol>
  );
}

function StepBadge({ step }: { step: WizardStep }) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        step.status === "done" && "border-transparent bg-primary/10 text-primary",
        step.status === "current" && "border-primary bg-primary text-primary-foreground font-medium",
        step.status === "upcoming" && "border-border text-muted-foreground"
      )}
    >
      {step.status === "done" ? <Check className="size-3.5" /> : null}
      {step.label}
    </span>
  );

  if (step.status === "upcoming") {
    return content;
  }

  return <Link href={step.href}>{content}</Link>;
}

import type { WizardStep } from "@/components/wizard-progress";

export interface JobWizardContext {
  jobId: string;
  jobMatchId: string | null;
  tailoredResumeStatus: "DRAFT" | "APPROVED" | null;
  hasApplication: boolean;
}

/**
 * The 5-step per-job loop (add -> analyze -> tailor -> approve -> apply),
 * computed identically regardless of which of the 3 pages in that loop is
 * currently rendering it — so the same step bar (same statuses, same
 * links) appears everywhere in the flow, not a different subset per page.
 */
export function buildJobWizardSteps(ctx: JobWizardContext): WizardStep[] {
  const { jobId, jobMatchId, tailoredResumeStatus, hasApplication } = ctx;

  const reviewHref = jobMatchId ? `/review/${jobMatchId}` : `/jobs/${jobId}`;

  const analyzeStatus: WizardStep["status"] = jobMatchId ? "done" : "current";
  const tailorStatus: WizardStep["status"] = tailoredResumeStatus
    ? "done"
    : jobMatchId
      ? "current"
      : "upcoming";
  const approveStatus: WizardStep["status"] =
    tailoredResumeStatus === "APPROVED" ? "done" : tailoredResumeStatus ? "current" : "upcoming";
  const applyStatus: WizardStep["status"] = hasApplication
    ? "done"
    : tailoredResumeStatus === "APPROVED"
      ? "current"
      : "upcoming";

  return [
    { label: "Add job", href: `/jobs/${jobId}`, status: "done" },
    { label: "Analyze", href: `/jobs/${jobId}`, status: analyzeStatus },
    { label: "Tailor & review", href: reviewHref, status: tailorStatus },
    { label: "Approve", href: reviewHref, status: approveStatus },
    { label: "Apply", href: `/applications/${jobId}`, status: applyStatus },
  ];
}

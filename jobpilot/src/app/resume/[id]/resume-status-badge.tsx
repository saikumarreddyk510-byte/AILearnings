import { Badge } from "@/components/ui/badge";
import type { ResumeStatus } from "@/lib/enums";

const STATUS_VARIANT: Record<ResumeStatus, "secondary" | "default" | "destructive"> = {
  UPLOADED: "secondary",
  EXTRACTING: "secondary",
  NEEDS_REVIEW: "default",
  VERIFIED: "default",
};

const STATUS_LABEL: Record<ResumeStatus, string> = {
  UPLOADED: "Uploaded",
  EXTRACTING: "Extracting…",
  NEEDS_REVIEW: "Needs review",
  VERIFIED: "Verified",
};

export function ResumeStatusBadge({ status }: { status: string }) {
  const known = (status in STATUS_LABEL ? status : "NEEDS_REVIEW") as ResumeStatus;
  return <Badge variant={STATUS_VARIANT[known]}>{STATUS_LABEL[known]}</Badge>;
}

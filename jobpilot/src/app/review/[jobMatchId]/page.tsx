import { notFound } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { getJobMatchByIdForUser } from "@/server/data/matches";
import {
  getLatestTailoredResumeForJobMatch,
  getLatestDecisionsByChangePath,
} from "@/server/data/tailored-resumes";
import { getLatestCoverLetterForJobMatch } from "@/server/data/cover-letters";
import { getLatestVerifiedResumeForUser } from "@/server/data/resumes";
import { getApplicationByJobIdForUser } from "@/server/data/applications";
import { parseResumeVersionSnapshot } from "@/lib/resume/version-snapshot";
import { getTailorableFieldText } from "@/lib/tailoring/field-mapping";
import { toStringArray } from "@/lib/matching/json-utils";
import { buildJobWizardSteps } from "@/lib/wizard-steps";
import { WizardProgress } from "@/components/wizard-progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnforcedChange } from "@/lib/tailoring/schemas";
import { ReviewPanel } from "./review-panel";

export default async function ReviewPage(props: PageProps<"/review/[jobMatchId]">) {
  const { jobMatchId } = await props.params;
  const userId = await requireUserId();

  const jobMatch = await getJobMatchByIdForUser(jobMatchId, userId);
  if (!jobMatch) notFound();

  const [tailoredResume, coverLetter, verifiedResume, application] = await Promise.all([
    getLatestTailoredResumeForJobMatch(jobMatchId, userId),
    getLatestCoverLetterForJobMatch(jobMatchId, userId),
    getLatestVerifiedResumeForUser(userId),
    getApplicationByJobIdForUser(jobMatch.jobId, userId),
  ]);

  const wizardSteps = buildJobWizardSteps({
    jobId: jobMatch.jobId,
    jobMatchId,
    tailoredResumeStatus: (tailoredResume?.status as "DRAFT" | "APPROVED" | undefined) ?? null,
    hasApplication: application !== null,
  });

  const decisions = tailoredResume
    ? await getLatestDecisionsByChangePath(tailoredResume.id)
    : new Map();

  const baseFacts = tailoredResume
    ? parseResumeVersionSnapshot(tailoredResume.baseVersion.snapshot).facts
    : [];
  const factsById = new Map(baseFacts.filter((f) => !!f.id).map((f) => [f.id as string, f]));

  const changes = tailoredResume
    ? (tailoredResume.recommendedChanges as unknown as EnforcedChange[]).map((change) => {
        const targetFact = factsById.get(change.targetFactId);
        const decision = decisions.get(String(change.index)) ?? null;
        return {
          changePath: String(change.index),
          section: change.section,
          status: change.status,
          uncertain: change.uncertain,
          confidence: change.confidence,
          originalText: targetFact ? getTailorableFieldText(targetFact) : change.originalText,
          proposedText: change.proposedText,
          reason: change.reason,
          decision: decision?.decision ?? null,
          editedText: decision?.editedText ?? null,
        };
      })
    : [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <WizardProgress steps={wizardSteps} />

      <div>
        <h1 className="text-2xl font-semibold">
          Review &amp; tailor — {jobMatch.job.title} at {jobMatch.job.company}
        </h1>
        <p className="text-muted-foreground">
          Every proposed change below must be accepted, edited, or rejected before you can
          give final approval. Nothing is exported until you approve.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match report</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold">{jobMatch.score}</span>
            <span className="text-muted-foreground">/ 100</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {toStringArray(jobMatch.matchedRequirements).map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
            {toStringArray(jobMatch.missingRequirements).map((s) => (
              <Badge key={s} variant="destructive">
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{jobMatch.job.description}</p>
        </CardContent>
      </Card>

      <ReviewPanel
        jobMatchId={jobMatchId}
        jobId={jobMatch.jobId}
        hasVerifiedResume={verifiedResume !== null}
        tailoredResume={
          tailoredResume ? { id: tailoredResume.id, status: tailoredResume.status, changes } : null
        }
        coverLetter={
          coverLetter
            ? { id: coverLetter.id, status: coverLetter.status, content: coverLetter.content }
            : null
        }
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { getJobByIdVisibleToUser } from "@/server/data/jobs";
import { getApplicationByJobIdForUser } from "@/server/data/applications";
import { getLatestJobMatchForUser } from "@/server/data/matches";
import { buildJobWizardSteps } from "@/lib/wizard-steps";
import { WizardProgress } from "@/components/wizard-progress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StartApplicationButton } from "./start-application-button";
import { ConfirmSubmissionForm } from "./confirm-submission-form";
import { ApplicationDetailsForm } from "./application-details-form";

export default async function ApplicationConfirmationPage(
  props: PageProps<"/applications/[jobId]">
) {
  const { jobId } = await props.params;
  const userId = await requireUserId();

  const job = await getJobByIdVisibleToUser(jobId, userId);
  if (!job) notFound();

  const [application, latestMatch] = await Promise.all([
    getApplicationByJobIdForUser(jobId, userId),
    getLatestJobMatchForUser(jobId, userId),
  ]);

  const wizardSteps = buildJobWizardSteps({
    jobId,
    jobMatchId: application?.tailoredResume?.jobMatchId ?? latestMatch?.id ?? null,
    tailoredResumeStatus:
      (application?.tailoredResume?.status as "DRAFT" | "APPROVED" | undefined) ?? null,
    hasApplication: application !== null,
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <WizardProgress steps={wizardSteps} />

      <div>
        <h1 className="text-2xl font-semibold">
          Apply — {job.title} at {job.company}
        </h1>
        {application && (
          <Badge variant="secondary" className="mt-2">
            {application.status}
          </Badge>
        )}
      </div>

      {!application ? (
        <Card>
          <CardHeader>
            <CardTitle>Not ready yet</CardTitle>
            <CardDescription>
              You need an approved tailored résumé for this job before starting an
              application. Go back to the job page, run a match analysis, generate and
              approve a tailored résumé, then return here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StartApplicationButton jobId={jobId} />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Official application</CardTitle>
              <CardDescription>
                Submit on the official site — this app never submits on your behalf.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {job.applicationUrl ? (
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  Open official application page ↗
                </a>
              ) : (
                <p className="text-muted-foreground">
                  No application URL on file for this job — use the original posting
                  below.
                </p>
              )}
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                Original posting ↗
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your approved documents</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {application.tailoredResume && (
                <a
                  href={`/review/${application.tailoredResume.jobMatchId}/export/resume`}
                  className="text-primary underline underline-offset-4"
                >
                  Download tailored résumé (.docx)
                </a>
              )}
              {application.coverLetter?.status === "APPROVED" && (
                <a
                  href={`/review/${application.coverLetter.jobMatchId}/export/cover-letter`}
                  className="text-primary underline underline-offset-4"
                >
                  Download cover letter (.docx)
                </a>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suggested screening answers</CardTitle>
              <CardDescription>
                Not yet available — no screening-question source is configured. Review
                and answer any screening questions directly on the official application.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission</CardTitle>
            </CardHeader>
            <CardContent>
              {application.status === "READY_TO_APPLY" ? (
                <ConfirmSubmissionForm applicationId={application.id} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {application.dateApplied
                    ? `Submitted on ${application.dateApplied.toLocaleDateString()}.`
                    : "Submission recorded."}{" "}
                  Current status: <span className="font-medium">{application.status}</span>.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
              <CardDescription>Notes, follow-ups, and interview details — editable any time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationDetailsForm
                applicationId={application.id}
                initialNotes={application.notes ?? ""}
                initialFollowUpDate={
                  application.followUpDate
                    ? application.followUpDate.toISOString().slice(0, 10)
                    : ""
                }
                initialContactInfo={(application.contactInfo as Record<string, string>) ?? {}}
                initialInterviewDates={
                  (application.interviewDates as { date: string; note?: string }[]) ?? []
                }
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

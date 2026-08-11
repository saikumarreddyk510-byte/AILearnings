import { notFound } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { getJobByIdVisibleToUser, getJobRequirementsForJob } from "@/server/data/jobs";
import { getLatestJobMatchForUser } from "@/server/data/matches";
import { listSearchProfilesForUser } from "@/server/data/search-profiles";
import { getLatestVerifiedResumeForUser } from "@/server/data/resumes";
import { getLatestTailoredResumeForJobMatch } from "@/server/data/tailored-resumes";
import { getApplicationByJobIdForUser } from "@/server/data/applications";
import { toStringArray } from "@/lib/matching/json-utils";
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
import { MatchAnalysisPanel } from "./match-analysis-panel";
import { TailoringPanel } from "./tailoring-panel";
import { ApplicationPanel } from "./application-panel";

export default async function JobDetailPage(props: PageProps<"/jobs/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const userId = await requireUserId();

  const job = await getJobByIdVisibleToUser(id, userId);
  if (!job) notFound();

  const [requirementsResult, latestMatch, profiles, verifiedResume] = await Promise.all([
    getJobRequirementsForJob(id, userId),
    getLatestJobMatchForUser(id, userId),
    listSearchProfilesForUser(userId),
    getLatestVerifiedResumeForUser(userId),
  ]);
  const requirements = requirementsResult ?? [];
  const isDuplicateNotice = searchParams?.duplicate === "1";

  const tailoredResume = latestMatch
    ? await getLatestTailoredResumeForJobMatch(latestMatch.id, userId)
    : null;
  const hasApprovedTailoredResume = tailoredResume?.status === "APPROVED";
  const application = await getApplicationByJobIdForUser(id, userId);

  const wizardSteps = buildJobWizardSteps({
    jobId: job.id,
    jobMatchId: latestMatch?.id ?? null,
    tailoredResumeStatus: (tailoredResume?.status as "DRAFT" | "APPROVED" | undefined) ?? null,
    hasApplication: application !== null,
  });

  const requiredSkills = toStringArray(job.requiredSkills);
  const preferredSkills = toStringArray(job.preferredSkills);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <WizardProgress steps={wizardSteps} />

      {isDuplicateNotice && (
        <div className="rounded-lg border bg-muted px-4 py-3 text-sm">
          This job was already in your list — showing the existing entry.
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold">
          {job.title} — {job.company}
        </h1>
        <p className="text-muted-foreground">
          Discovered {job.dateDiscovered.toLocaleDateString()}
          {job.datePosted ? ` · Posted ${job.datePosted.toLocaleDateString()}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline">{job.source}</Badge>
          {job.workplaceType && <Badge variant="secondary">{job.workplaceType}</Badge>}
          {job.employmentType && <Badge variant="secondary">{job.employmentType}</Badge>}
          {job.location && <Badge variant="secondary">{job.location}</Badge>}
          {(job.salaryMin || job.salaryMax) && (
            <Badge variant="secondary">
              {job.salaryMin ?? "?"}–{job.salaryMax ?? "?"}
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{job.description}</p>
        </CardContent>
      </Card>

      {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {requiredSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium">Required</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {requiredSkills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {preferredSkills.length > 0 && (
              <div>
                <p className="text-sm font-medium">Preferred</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {preferredSkills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {requirements.map((req) => (
                <li key={req.id}>
                  <Badge variant="outline" className="mr-2">
                    {req.type}
                  </Badge>
                  {req.text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
          <CardDescription>
            Every job records where it came from — nothing here was
            automatically fetched.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4"
          >
            Original posting ↗
          </a>
          {job.applicationUrl && (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              Application page ↗
            </a>
          )}
          {job.attribution && (
            <p className="text-muted-foreground">{job.attribution}</p>
          )}
        </CardContent>
      </Card>

      <MatchAnalysisPanel
        jobId={job.id}
        profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
        hasVerifiedResume={verifiedResume !== null}
        initialMatch={
          latestMatch
            ? {
                score: latestMatch.score,
                matchedRequirements: toStringArray(latestMatch.matchedRequirements),
                missingRequirements: toStringArray(latestMatch.missingRequirements),
                transferableSkills: toStringArray(latestMatch.transferableSkills),
                hardFilterFailures: toStringArray(latestMatch.hardFilterFailures),
                concerns: toStringArray(latestMatch.concerns),
                explanation: latestMatch.explanation,
                provider: latestMatch.aiExecution?.provider ?? null,
                promptVersion: latestMatch.aiExecution?.promptVersion ?? null,
              }
            : null
        }
      />

      <TailoringPanel jobMatchId={latestMatch?.id ?? null} />

      <ApplicationPanel jobId={job.id} hasApprovedTailoredResume={hasApprovedTailoredResume} />
    </div>
  );
}

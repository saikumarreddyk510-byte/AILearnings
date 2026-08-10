import { notFound } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import {
  getMasterResumeByIdForUser,
  listResumeFactsForUser,
  listResumeVersionsForUser,
} from "@/server/data/resumes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResumeStatusBadge } from "./resume-status-badge";
import { ExtractedTextPanel } from "./extracted-text-panel";
import { FactEditor } from "./fact-editor";
import { SaveVersionButton } from "./save-version-button";

export default async function ResumeDetailPage(
  props: PageProps<"/resume/[id]">
) {
  const { id } = await props.params;
  const userId = await requireUserId();

  const resume = await getMasterResumeByIdForUser(id, userId);
  if (!resume) notFound();

  const facts = (await listResumeFactsForUser(id, userId)) ?? [];
  const versions = (await listResumeVersionsForUser(id, userId)) ?? [];

  const unverifiedCount = facts.filter((f) => !f.verified).length;
  const disabledReason =
    facts.length === 0
      ? "Add at least one fact before saving a version."
      : unverifiedCount > 0
        ? `${unverifiedCount} fact(s) still need to be marked verified.`
        : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{resume.originalFileName}</h1>
          <p className="text-muted-foreground">
            Uploaded {resume.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ResumeStatusBadge status={resume.status} />
          <Button variant="outline" size="sm" render={<a href={`/resume/${id}/file`} />}>
            Download original
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extracted text</CardTitle>
          <CardDescription>
            Correct any extraction mistakes before building facts below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExtractedTextPanel masterResumeId={id} extractedText={resume.extractedText} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structured facts</CardTitle>
          <CardDescription>
            Confirm what&apos;s accurate. Lock a fact to prevent it from ever
            being changed automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FactEditor masterResumeId={id} initialFacts={facts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Save a version</CardTitle>
          <CardDescription>
            Once every fact is verified, save a snapshot you can tailor for
            job applications later.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SaveVersionButton masterResumeId={id} disabledReason={disabledReason} />

          {versions.length > 0 && (
            <div className="flex flex-col gap-1 border-t pt-4">
              <h3 className="text-sm font-medium">Version history</h3>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {versions.map((version) => (
                  <li key={version.id}>
                    v{version.versionNumber} — {version.createdAt.toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

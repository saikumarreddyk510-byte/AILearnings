import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { listMasterResumesForUser } from "@/server/data/resumes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResumeStatusBadge } from "./[id]/resume-status-badge";
import { UploadResumeForm } from "./upload-resume-form";

export default async function ResumeListPage() {
  const userId = await requireUserId();
  const resumes = await listMasterResumesForUser(userId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Your master résumés</h1>
        <p className="text-muted-foreground">
          Upload a résumé, then confirm the structured facts we&apos;ll use
          for job matching later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload a résumé</CardTitle>
          <CardDescription>PDF or DOCX, up to 5MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <UploadResumeForm />
        </CardContent>
      </Card>

      {resumes.length > 0 && (
        <div className="flex flex-col gap-3">
          {resumes.map((resume) => (
            <Card key={resume.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    {resume.originalFileName}
                  </CardTitle>
                  <CardDescription>
                    Uploaded {resume.createdAt.toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <ResumeStatusBadge status={resume.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/resume/${resume.id}`} />}
                  >
                    Review
                  </Button>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

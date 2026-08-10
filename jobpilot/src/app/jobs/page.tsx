import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { listJobsVisibleToUser } from "@/server/data/jobs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SOURCE_LABEL: Record<string, string> = {
  MOCK: "Sample catalog",
  MANUAL_URL: "Added by you",
  MANUAL_PASTE: "Added by you",
  CSV_IMPORT: "Imported by you",
};

export default async function JobsListPage() {
  const userId = await requireUserId();
  const jobs = await listJobsVisibleToUser(userId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-muted-foreground">
            Jobs you&apos;ve added, imported, or that are in the shared
            sample catalog.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/jobs/import" />}>
            Import CSV
          </Button>
          <Button render={<Link href="/jobs/new" />}>Add a job</Button>
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No jobs yet</CardTitle>
            <CardDescription>
              Add one manually or import a CSV to get started.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">
                      {job.title} — {job.company}
                    </CardTitle>
                    <CardDescription>
                      {job.location ?? "Location not specified"}
                      {job.workplaceType ? ` · ${job.workplaceType}` : ""} ·
                      Discovered {job.dateDiscovered.toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={job.createdByUserId ? "secondary" : "outline"}>
                    {SOURCE_LABEL[job.source] ?? job.source}
                  </Badge>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

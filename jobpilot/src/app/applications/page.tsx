import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { listApplicationsForUser } from "@/server/data/applications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApplicationStatusSelect } from "./application-status-select";

const KANBAN_STATUSES = ["READY_TO_APPLY", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"] as const;
const OUTCOME_STATUSES = new Set(["APPLIED", "REJECTED", "INTERVIEW", "OFFER", "WITHDRAWN"]);

function isFollowUpDue(followUpDate: Date | null): boolean {
  if (!followUpDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return followUpDate <= today;
}

export default async function ApplicationTrackerPage(props: PageProps<"/applications">) {
  const searchParams = await props.searchParams;
  const userId = await requireUserId();
  const view = searchParams?.view === "kanban" ? "kanban" : "table";

  const applications = await listApplicationsForUser(userId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Application tracker</h1>
          <p className="text-muted-foreground">
            Every application you&apos;ve started, with its current status and follow-ups.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "table" ? "default" : "outline"}
            size="sm"
            render={<Link href="/applications?view=table" />}
          >
            Table
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            render={<Link href="/applications?view=kanban" />}
          >
            Kanban
          </Button>
        </div>
      </div>

      {applications.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No applications yet</CardTitle>
            <CardDescription>
              Start one from a job&apos;s page once you have an approved tailored résumé.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {applications.length > 0 && view === "table" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Match score</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Résumé v.</TableHead>
                  <TableHead>Cover letter v.</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Interviews</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => {
                  const contactInfo = app.contactInfo as { name?: string } | null;
                  const interviewDates = (app.interviewDates as { date: string }[] | null) ?? [];
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Link
                          href={`/applications/${app.jobId}`}
                          className="text-primary underline underline-offset-4"
                        >
                          {app.job.company}
                        </Link>
                      </TableCell>
                      <TableCell>{app.job.title}</TableCell>
                      <TableCell>{app.matchScoreSnapshot ?? "—"}</TableCell>
                      <TableCell>{app.job.source}</TableCell>
                      <TableCell>{app.job.datePosted?.toLocaleDateString() ?? "—"}</TableCell>
                      <TableCell>{app.dateApplied?.toLocaleDateString() ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{app.status}</Badge>
                      </TableCell>
                      <TableCell>{app.tailoredResume?.versionNumber ?? "—"}</TableCell>
                      <TableCell>{app.coverLetter?.versionNumber ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {app.followUpDate?.toLocaleDateString() ?? "—"}
                          {isFollowUpDue(app.followUpDate) && (
                            <Badge variant="destructive">Follow up due</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{contactInfo?.name || "—"}</TableCell>
                      <TableCell>{interviewDates.length > 0 ? interviewDates.length : "—"}</TableCell>
                      <TableCell className="max-w-48 truncate">{app.notes || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {applications.length > 0 && view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_STATUSES.map((status) => {
            const columnApps = applications.filter((app) => app.status === status);
            return (
              <div key={status} className="flex w-64 shrink-0 flex-col gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {status} ({columnApps.length})
                </p>
                <div className="flex flex-col gap-2">
                  {columnApps.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="flex flex-col gap-2 p-3">
                        <Link
                          href={`/applications/${app.jobId}`}
                          className="text-sm font-medium text-primary underline underline-offset-4"
                        >
                          {app.job.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{app.job.company}</p>
                        <div className="flex items-center gap-1.5">
                          {app.matchScoreSnapshot !== null && (
                            <Badge variant="outline">{app.matchScoreSnapshot}/100</Badge>
                          )}
                          {isFollowUpDue(app.followUpDate) && (
                            <Badge variant="destructive">Follow up due</Badge>
                          )}
                        </div>
                        {OUTCOME_STATUSES.has(app.status) && app.status !== "READY_TO_APPLY" && (
                          <ApplicationStatusSelect applicationId={app.id} currentStatus={app.status} />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

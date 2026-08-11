import Link from "next/link";
import { auth } from "@/server/auth/config";
import { requireUserId } from "@/server/auth/session";
import { listMasterResumesForUser } from "@/server/data/resumes";
import { listJobsVisibleToUser } from "@/server/data/jobs";
import { listSearchProfilesForUser } from "@/server/data/search-profiles";
import { listApplicationsForUser } from "@/server/data/applications";
import { signOutAction } from "@/server/actions/sign-out";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  // Redirects to /sign-in if there's no session — the real (secure) check.
  // Proxy already did an optimistic version of this before the request
  // reached here.
  const userId = await requireUserId();
  const session = await auth();
  const [resumes, jobs, searchProfiles, applications] = await Promise.all([
    listMasterResumesForUser(userId),
    listJobsVisibleToUser(userId),
    listSearchProfilesForUser(userId),
    listApplicationsForUser(userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome, {session?.user?.name ?? session?.user?.email}
          </h1>
          <p className="text-muted-foreground">
            Verify your résumé, describe the roles you want, add jobs, analyze and
            tailor for the ones that fit, and track every application you start.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" render={<Link href="/settings" />}>
            Settings
          </Button>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Your master résumés</CardTitle>
            <CardDescription>
              {resumes.length === 0
                ? "None uploaded yet."
                : `${resumes.length} résumé(s) on file.`}
            </CardDescription>
          </div>
          <Button size="sm" render={<Link href="/resume" />}>
            {resumes.length === 0 ? "Upload a résumé" : "Manage résumés"}
          </Button>
        </CardHeader>
        <CardContent>
          {resumes.length > 0 && (
            <ul className="flex flex-col gap-2 text-sm">
              {resumes.map((resume) => (
                <li key={resume.id}>
                  <Link href={`/resume/${resume.id}`} className="underline">
                    {resume.originalFileName}
                  </Link>{" "}
                  — {resume.status}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Search profiles</CardTitle>
            <CardDescription>
              {searchProfiles.length === 0
                ? "None yet — describe the roles you want."
                : `${searchProfiles.length} profile(s) set up.`}
            </CardDescription>
          </div>
          <Button size="sm" render={<Link href="/search-profiles" />}>
            {searchProfiles.length === 0 ? "Create a profile" : "Manage profiles"}
          </Button>
        </CardHeader>
        <CardContent />
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>
              {jobs.length === 0
                ? "None yet — add one manually or import a CSV."
                : `${jobs.length} job(s) visible to you.`}
            </CardDescription>
          </div>
          <Button size="sm" render={<Link href="/jobs" />}>
            {jobs.length === 0 ? "Add a job" : "View jobs"}
          </Button>
        </CardHeader>
        <CardContent />
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              {applications.length === 0
                ? "None started yet — approve a tailored résumé on a job to begin."
                : `${applications.length} application(s) tracked.`}
            </CardDescription>
          </div>
          <Button size="sm" render={<Link href="/applications" />}>
            {applications.length === 0 ? "View tracker" : "Open tracker"}
          </Button>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}

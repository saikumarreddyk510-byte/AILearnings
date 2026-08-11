import Link from "next/link";
import { Check } from "lucide-react";
import { auth } from "@/server/auth/config";
import { requireUserId } from "@/server/auth/session";
import { listMasterResumesForUser } from "@/server/data/resumes";
import { listJobsVisibleToUser } from "@/server/data/jobs";
import { listSearchProfilesForUser } from "@/server/data/search-profiles";
import { listApplicationsForUser } from "@/server/data/applications";
import { signOutAction } from "@/server/actions/sign-out";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ChecklistStep {
  label: string;
  description: string;
  href: string;
  done: boolean;
  optional?: boolean;
}

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

  const hasVerifiedResume = resumes.some((r) => r.status === "VERIFIED");
  const hasSearchProfile = searchProfiles.length > 0;
  const hasJob = jobs.length > 0;
  const hasApplication = applications.length > 0;

  const steps: ChecklistStep[] = [
    {
      label: "Verify your résumé",
      description: "Upload a PDF/DOCX and confirm your facts are accurate.",
      href: resumes.length === 0 ? "/resume" : `/resume/${resumes[0].id}`,
      done: hasVerifiedResume,
    },
    {
      label: "Set a search profile",
      description: "Describe the roles you want — optional, sharpens matching later.",
      href: "/search-profiles",
      done: hasSearchProfile,
      optional: true,
    },
    {
      label: "Add a job you're interested in",
      description: "Paste in a real posting — nothing is scraped automatically.",
      href: hasJob ? "/jobs" : "/jobs/new",
      done: hasJob,
    },
    {
      label: "Track an application",
      description: "Analyze, tailor, approve, and apply — then it shows up here.",
      href: "/applications",
      done: hasApplication,
    },
  ];

  // The single next thing to do: first incomplete required step, or the
  // first incomplete optional one, or — everything done — the tracker.
  const nextStep =
    steps.find((s) => !s.done && !s.optional) ??
    steps.find((s) => !s.done) ??
    steps[steps.length - 1];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome, {session?.user?.name ?? session?.user?.email}
          </h1>
          <p className="text-muted-foreground">
            Follow the steps below in order — each one unlocks the next.
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
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            {steps.every((s) => s.done || s.optional)
              ? "Setup's done — add more jobs any time to keep the loop going."
              : "Complete these in order for the smoothest path to an application."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => (
              <li key={step.label} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                    step.done
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {step.done ? <Check className="size-3.5" /> : index + 1}
                </span>
                <div className="flex-1">
                  <Link href={step.href} className="text-sm font-medium underline-offset-4 hover:underline">
                    {step.label}
                  </Link>
                  {step.optional && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(optional)</span>
                  )}
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <Button render={<Link href={nextStep.href} />} className="w-fit">
            Continue: {nextStep.label}
          </Button>
        </CardContent>
      </Card>

      {hasVerifiedResume && hasSearchProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-Pilot</CardTitle>
            <CardDescription>
              Run search → score → tailor in one pass, then review and approve per job. Nothing
              is submitted automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/auto-pilot" />} className="w-fit">
              Open Auto-Pilot
            </Button>
          </CardContent>
        </Card>
      )}

      {resumes.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Your master résumés</CardTitle>
              <CardDescription>{resumes.length} résumé(s) on file.</CardDescription>
            </div>
            <Button size="sm" variant="outline" render={<Link href="/resume" />}>
              Manage résumés
            </Button>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

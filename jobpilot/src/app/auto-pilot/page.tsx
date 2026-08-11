import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { listSearchProfilesForUser } from "@/server/data/search-profiles";
import { getLatestVerifiedResumeForUser } from "@/server/data/resumes";
import { AutoPilotRunner } from "@/components/auto-pilot-runner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AutoPilotPage() {
  const userId = await requireUserId();
  const [profiles, verified] = await Promise.all([
    listSearchProfilesForUser(userId),
    getLatestVerifiedResumeForUser(userId),
  ]);

  const profileOptions = profiles.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Auto-Pilot</h1>
        <p className="text-muted-foreground">
          One guided pass: search → score → tailor — stopping at your approval.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Auto-Pilot automates the busywork, not the decision.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <ol className="flex flex-col gap-1.5">
            <li>1. Searches permitted job sources for your profile&apos;s target roles.</li>
            <li>2. Scores each job against your verified résumé (match %).</li>
            <li>3. Drafts a tailored résumé per job and shows exactly what changed.</li>
            <li>4. You review, approve, and apply per job — it never submits for you.</li>
          </ol>
          <p className="text-muted-foreground">
            It does not scrape LinkedIn or auto-submit applications — those are disallowed by
            design. For jobs without an approved application API, the apply step opens the
            official posting so you can submit yourself.
          </p>
        </CardContent>
      </Card>

      {!verified ? (
        <Card>
          <CardHeader>
            <CardTitle>Verify a résumé first</CardTitle>
            <CardDescription>
              Auto-Pilot tailors your verified master résumé — you need one before it can run.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/resume" />}>Go to résumés</Button>
          </CardContent>
        </Card>
      ) : (
        <AutoPilotRunner profiles={profileOptions} />
      )}
    </div>
  );
}

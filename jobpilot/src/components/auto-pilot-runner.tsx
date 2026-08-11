"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { runAutoPilotAction, type RunAutoPilotActionResult } from "@/server/actions/auto-pilot";
import type { AutoPilotJobResult } from "@/lib/auto-pilot/run";

interface ProfileOption {
  id: string;
  name: string;
}

const ERROR_LABEL: Record<string, string> = {
  NO_VERIFIED_RESUME:
    "You need a verified master résumé first. Upload and verify one, then come back.",
  PROFILE_NOT_FOUND: "That search profile could not be found.",
  SOURCE_UNAVAILABLE: "The job source is unavailable right now.",
};

export function AutoPilotRunner({ profiles }: { profiles: ProfileOption[] }) {
  const [selectedId, setSelectedId] = useState(profiles[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<RunAutoPilotActionResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleRun() {
    if (!selectedId) return;
    setMessage(null);
    setResult(null);
    startTransition(async () => {
      const res = await runAutoPilotAction(selectedId);
      if (!res.ok) {
        if (res.error === "RATE_LIMITED") {
          setMessage(`Slow down — try again in about ${res.retryAfterSeconds}s.`);
        } else {
          setMessage(ERROR_LABEL[res.error] ?? "Auto-Pilot could not run.");
        }
        return;
      }
      setResult(res);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Run Auto-Pilot</CardTitle>
          <CardDescription>
            Pick a search profile. Auto-Pilot searches permitted sources for its target
            roles, scores each job against your verified résumé, and drafts a tailored
            résumé for every match — then stops so you can review and approve. It never
            submits anything on its own.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No search profiles yet.{" "}
              <Link href="/search-profiles" className="text-primary underline underline-offset-4">
                Create one
              </Link>{" "}
              with your target roles to use Auto-Pilot.
            </p>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Search profile</span>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={isPending}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={handleRun} disabled={isPending || !selectedId} className="w-fit">
                {isPending ? "Running Auto-Pilot…" : "Run Auto-Pilot"}
              </Button>
            </>
          )}
          {message && <p className="text-sm text-destructive">{message}</p>}
        </CardContent>
      </Card>

      {result?.ok && <AutoPilotResults result={result} />}
    </div>
  );
}

function AutoPilotResults({ result }: { result: Extract<RunAutoPilotActionResult, { ok: true }> }) {
  if (result.noMatches) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No matches found</CardTitle>
          <CardDescription>
            No jobs matched the target roles ({result.targetRoleTitles.join(", ") || "none set"}).
            Adjust the profile&apos;s target role titles, or add jobs manually.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const prepared = result.jobs.filter((j) => j.jobMatchId && !j.error).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">
          {prepared} of {result.jobs.length} job(s) ready to review
        </h2>
        <p className="text-sm text-muted-foreground">
          Profile “{result.profileName}”. Each card shows the match %, what matched vs. what&apos;s
          missing, and the tailored changes drafted for your approval.
        </p>
      </div>
      {result.jobs.map((job) => (
        <AutoPilotJobCard key={job.jobId} job={job} />
      ))}
    </div>
  );
}

function AutoPilotJobCard({ job }: { job: AutoPilotJobResult }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-3">
        <div>
          <CardTitle className="text-base">{job.title}</CardTitle>
          <CardDescription>{job.company}</CardDescription>
        </div>
        {job.score !== null && (
          <Badge variant={job.score >= 60 ? "default" : "secondary"}>{job.score}% match</Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {job.error && <p className="text-destructive">{job.error}</p>}

        {job.hardFilterFailures.length > 0 && (
          <p className="text-muted-foreground">
            <span className="font-medium">Heads up:</span> {job.hardFilterFailures.join("; ")}
          </p>
        )}

        {job.jobMatchId && (
          <div className="grid gap-3 sm:grid-cols-2">
            <StatList label="Matched requirements" items={job.matchedRequirements} tone="positive" />
            <StatList label="Missing requirements" items={job.missingRequirements} tone="negative" />
          </div>
        )}

        {job.appliedChangeCount > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="font-medium">
              What was updated ({job.appliedChangeCount} change{job.appliedChangeCount === 1 ? "" : "s"})
            </p>
            <ul className="flex flex-col gap-1.5">
              {job.proposedChanges.map((change, i) => (
                <li key={i} className="rounded-md border border-border px-3 py-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {change.section}
                  </span>
                  <p className="text-sm">{change.proposedText}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {job.reviewHref && (
            <Button size="sm" render={<Link href={job.reviewHref} />}>
              Review &amp; approve
            </Button>
          )}
          <Button size="sm" variant="outline" render={<Link href={job.applyHref} />}>
            Go to apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-medium">{label}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">—</p>
      ) : (
        <ul className="flex flex-wrap gap-1">
          {items.map((item) => (
            <Badge key={item} variant={tone === "positive" ? "default" : "outline"}>
              {item}
            </Badge>
          ))}
        </ul>
      )}
    </div>
  );
}

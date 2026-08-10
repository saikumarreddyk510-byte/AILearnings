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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toStringArray } from "@/lib/matching/json-utils";
import { analyzeJobMatchAction } from "@/server/actions/matches";

interface MatchState {
  score: number;
  matchedRequirements: string[];
  missingRequirements: string[];
  transferableSkills: string[];
  hardFilterFailures: string[];
  concerns: string[];
  explanation: string;
  provider: string | null;
  promptVersion: string | null;
}

const ERROR_LABEL: Record<string, string> = {
  NO_VERIFIED_RESUME: "Something went wrong looking up your résumé.",
  JOB_NOT_FOUND: "This job could not be found.",
  PROFILE_NOT_FOUND: "That search profile could not be found.",
};

export function MatchAnalysisPanel({
  jobId,
  profiles,
  hasVerifiedResume,
  initialMatch,
}: {
  jobId: string;
  profiles: { id: string; name: string }[];
  hasVerifiedResume: boolean;
  initialMatch: MatchState | null;
}) {
  const [profileId, setProfileId] = useState<string>("");
  const [match, setMatch] = useState<MatchState | null>(initialMatch);
  const [aiDegraded, setAiDegraded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnalyze() {
    setError(null);
    startTransition(async () => {
      const result = await analyzeJobMatchAction(jobId, profileId || null);
      if (!result.ok) {
        setError(ERROR_LABEL[result.error] ?? "Analysis failed.");
        return;
      }
      const jm = result.jobMatch;
      setMatch({
        score: jm.score,
        matchedRequirements: toStringArray(jm.matchedRequirements),
        missingRequirements: toStringArray(jm.missingRequirements),
        transferableSkills: toStringArray(jm.transferableSkills),
        hardFilterFailures: toStringArray(jm.hardFilterFailures),
        concerns: toStringArray(jm.concerns),
        explanation: jm.explanation,
        provider: jm.aiExecution?.provider ?? null,
        promptVersion: jm.aiExecution?.promptVersion ?? null,
      });
      setAiDegraded(result.aiDegraded);
    });
  }

  if (!hasVerifiedResume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match analysis</CardTitle>
          <CardDescription>
            Verify a résumé before analyzing how well this job matches you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/resume" />}>Go verify your résumé</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match analysis</CardTitle>
        <CardDescription>
          Score and skill comparison are computed directly from your résumé and
          this job posting. Concerns and the explanation below are AI-generated.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          {profiles.length > 0 && (
            <Select value={profileId} onValueChange={(v) => setProfileId(v ?? "")}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="No profile — skip hard filters" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleAnalyze} disabled={isPending}>
            {isPending ? "Analyzing…" : match ? "Re-analyze" : "Analyze this job"}
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {match && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{match.score}</span>
              <span className="text-muted-foreground">/ 100</span>
              <div className="ml-2 h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${match.score}%` }}
                />
              </div>
            </div>

            {match.hardFilterFailures.length > 0 && (
              <div>
                <p className="text-sm font-medium">Hard filter notes</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {match.hardFilterFailures.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Matched</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {match.matchedRequirements.length === 0 && (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                  {match.matchedRequirements.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Missing</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {match.missingRequirements.length === 0 && (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                  {match.missingRequirements.map((s) => (
                    <Badge key={s} variant="destructive">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Transferable</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {match.transferableSkills.length === 0 && (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                  {match.transferableSkills.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {match.concerns.length > 0 && (
              <div>
                <p className="text-sm font-medium">Concerns</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-muted-foreground">
                  {match.concerns.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-sm font-medium">Explanation</p>
              <p className="mt-1 text-sm text-muted-foreground">{match.explanation}</p>
            </div>

            {aiDegraded && (
              <p className="text-sm text-destructive">
                AI narrative generation was unavailable this run — the score and
                skill comparison above are unaffected.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Score, matched/missing/transferable skills: computed directly, not
              AI-generated. Concerns and explanation: AI-generated (provider
              &quot;{match.provider ?? "unknown"}&quot; · {match.promptVersion ?? "n/a"}).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

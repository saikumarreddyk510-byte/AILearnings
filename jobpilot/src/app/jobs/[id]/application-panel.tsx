"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Mirrors tailoring-panel.tsx's shape exactly: a dumb card, no server
 * action, no write on render — the one write path (starting the
 * Application row) lives on /applications/[jobId] itself, behind an
 * explicit user click.
 *
 * Copy note: this panel's wording is deliberately checked against every
 * existing tests/e2e/*.spec.ts locator that runs on /jobs/[id]
 * (job-match-analysis.spec.ts, tailoring-review.spec.ts) — avoid "verify,"
 * "analyze," and "match analysis" here. A Phase 5 e2e test broke silently
 * from exactly this kind of collision; re-check before changing this copy.
 */
export function ApplicationPanel({
  jobId,
  hasApprovedTailoredResume,
}: {
  jobId: string;
  hasApprovedTailoredResume: boolean;
}) {
  if (!hasApprovedTailoredResume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apply to this job</CardTitle>
          <CardDescription>
            Approve your tailored résumé above before starting an application.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply to this job</CardTitle>
        <CardDescription>
          Open the official application page, download your approved documents, and
          record the result once you&apos;ve submitted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button render={<Link href={`/applications/${jobId}`} />}>
          Continue to application
        </Button>
      </CardContent>
    </Card>
  );
}

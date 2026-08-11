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
 * Trivial entry point from the job-detail page into the full review flow —
 * no generation logic lives here on purpose, so there's only one place
 * (the /review/[jobMatchId] page) that can kick off tailoring/cover-letter
 * generation.
 */
export function TailoringPanel({ jobMatchId }: { jobMatchId: string | null }) {
  if (!jobMatchId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tailored résumé &amp; cover letter</CardTitle>
          <CardDescription>Analyze this job above first.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tailored résumé &amp; cover letter</CardTitle>
        <CardDescription>
          Generate an AI-assisted tailored résumé and optional cover letter for this
          job, review every proposed change, and approve before exporting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button render={<Link href={`/review/${jobMatchId}`} />}>
          Review &amp; tailor for this job
        </Button>
      </CardContent>
    </Card>
  );
}

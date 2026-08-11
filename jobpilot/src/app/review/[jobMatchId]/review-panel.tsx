"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { REQUIRED_CONFIRMATION_TEXT } from "@/lib/tailoring/constants";
import {
  generateTailoredResumeAction,
  generateCoverLetterAction,
  recordReviewDecisionAction,
  updateCoverLetterAction,
  approveApplicationMaterialsAction,
} from "@/server/actions/tailoring";

interface ChangeRow {
  changePath: string;
  section: string;
  status: string;
  uncertain: boolean;
  confidence: number;
  originalText: string;
  proposedText: string;
  reason: string;
  decision: "ACCEPTED" | "REJECTED" | "EDITED" | null;
  editedText: string | null;
}

interface TailoredResumeState {
  id: string;
  status: string;
  changes: ChangeRow[];
}

interface CoverLetterState {
  id: string;
  status: string;
  content: string;
}

const TAILOR_ERROR_LABEL: Record<string, string> = {
  JOB_MATCH_NOT_FOUND: "This job match could not be found.",
  NO_VERIFIED_RESUME: "Verify a résumé before generating a tailored résumé.",
  AI_GENERATION_FAILED: "Generation failed this run — try again.",
  RATE_LIMITED: "Too many requests — please wait a moment and try again.",
};

const APPROVE_ERROR_LABEL: Record<string, string> = {
  JOB_MATCH_NOT_FOUND: "This job match could not be found.",
  NO_TAILORED_RESUME: "Generate a tailored résumé before approving.",
  ALREADY_APPROVED: "This has already been approved.",
  PENDING_DECISIONS: "Accept, reject, or edit every proposed change before approving.",
  CONFIRMATION_TEXT_MISMATCH: "The confirmation text did not match.",
};

export function ReviewPanel({
  jobMatchId,
  hasVerifiedResume,
  tailoredResume,
  coverLetter,
}: {
  jobMatchId: string;
  hasVerifiedResume: boolean;
  tailoredResume: TailoredResumeState | null;
  coverLetter: CoverLetterState | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coverLetterDraft, setCoverLetterDraft] = useState(coverLetter?.content ?? "");
  const [confirmed, setConfirmed] = useState(false);

  function refresh() {
    router.refresh();
  }

  function handleGenerateResume() {
    setError(null);
    startTransition(async () => {
      const result = await generateTailoredResumeAction(jobMatchId);
      if (!result.ok) {
        setError(TAILOR_ERROR_LABEL[result.error] ?? "Generation failed.");
        return;
      }
      refresh();
    });
  }

  function handleGenerateCoverLetter() {
    setError(null);
    startTransition(async () => {
      const result = await generateCoverLetterAction(jobMatchId);
      if (!result.ok) {
        setError(TAILOR_ERROR_LABEL[result.error] ?? "Generation failed.");
        return;
      }
      refresh();
    });
  }

  function handleSaveCoverLetter() {
    setError(null);
    startTransition(async () => {
      if (!coverLetter) return;
      const ok = await updateCoverLetterAction(coverLetter.id, coverLetterDraft);
      if (!ok) {
        setError("Could not save the cover letter.");
        return;
      }
      refresh();
    });
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveApplicationMaterialsAction(
        jobMatchId,
        confirmed ? REQUIRED_CONFIRMATION_TEXT : ""
      );
      if (!result.ok) {
        setError(APPROVE_ERROR_LABEL[result.error] ?? "Approval failed.");
        return;
      }
      refresh();
    });
  }

  if (!hasVerifiedResume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tailored résumé &amp; cover letter</CardTitle>
          <CardDescription>Verify a résumé before generating tailored materials.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const undecidedCount = tailoredResume
    ? tailoredResume.changes.filter((c) => c.status === "OK" && !c.decision).length
    : 0;
  const canApprove =
    !!tailoredResume &&
    tailoredResume.status !== "APPROVED" &&
    undecidedCount === 0 &&
    confirmed;

  return (
    <div className="flex flex-col gap-6">
      {!tailoredResume && (
        <Card>
          <CardHeader>
            <CardTitle>Tailored résumé</CardTitle>
            <CardDescription>
              Generate AI-suggested rewrites for your summary, skills, work history, and
              projects — grounded only in your verified résumé facts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGenerateResume} disabled={isPending}>
              {isPending ? "Generating…" : "Generate tailored résumé"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tailoredResume && (
        <Card>
          <CardHeader>
            <CardTitle>Proposed changes</CardTitle>
            <CardDescription>
              {tailoredResume.status === "APPROVED"
                ? "Approved — this résumé's content is final."
                : `${undecidedCount} change(s) still need a decision.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {tailoredResume.changes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No changes were proposed for this résumé.
              </p>
            )}
            {tailoredResume.changes.map((change) => (
              <ChangeCardBound
                key={change.changePath}
                tailoredResumeId={tailoredResume.id}
                change={change}
                onDecided={refresh}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cover letter (optional)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!coverLetter ? (
            <Button onClick={handleGenerateCoverLetter} disabled={isPending}>
              {isPending ? "Generating…" : "Generate cover letter"}
            </Button>
          ) : (
            <>
              <Textarea
                value={coverLetterDraft}
                onChange={(e) => setCoverLetterDraft(e.target.value)}
                disabled={coverLetter.status === "APPROVED"}
                rows={10}
              />
              {coverLetter.status !== "APPROVED" && (
                <Button size="sm" onClick={handleSaveCoverLetter} disabled={isPending}>
                  Save cover letter
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {tailoredResume && (
        <Card>
          <CardHeader>
            <CardTitle>Final approval</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {tailoredResume.status === "APPROVED" ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Approved. Download your final documents below.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button render={<a href={`/review/${jobMatchId}/export/resume`} />}>
                    Download tailored résumé (.docx)
                  </Button>
                  {coverLetter?.status === "APPROVED" && (
                    <Button
                      variant="outline"
                      render={<a href={`/review/${jobMatchId}/export/cover-letter`} />}
                    >
                      Download cover letter (.docx)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked === true)}
                  />
                  <span>{REQUIRED_CONFIRMATION_TEXT}</span>
                </label>
                <Button onClick={handleApprove} disabled={isPending || !canApprove}>
                  {isPending ? "Approving…" : "Approve"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Binds tailoredResumeId into the decision action, kept out of ChangeCard's own props for clarity. */
function ChangeCardBound({
  tailoredResumeId,
  change,
  onDecided,
}: {
  tailoredResumeId: string;
  change: ChangeRow;
  onDecided: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(change.editedText ?? change.proposedText);
  const [error, setError] = useState<string | null>(null);

  const dropped = change.status !== "OK";

  function decide(decision: "ACCEPTED" | "REJECTED" | "EDITED", text?: string) {
    setError(null);
    startTransition(async () => {
      const result = await recordReviewDecisionAction(
        tailoredResumeId,
        change.changePath,
        decision,
        text
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      onDecided();
    });
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{change.section}</Badge>
        {dropped && <Badge variant="destructive">Unsupported — {change.status}</Badge>}
        {!dropped && change.uncertain && <Badge variant="secondary">Uncertain</Badge>}
        {!dropped && change.decision && <Badge variant="secondary">{change.decision}</Badge>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Original</p>
          <p className="whitespace-pre-wrap text-sm">{change.originalText || "(empty)"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Proposed</p>
          <p className="whitespace-pre-wrap text-sm">{change.proposedText}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Reason: {change.reason}</p>

      {dropped ? (
        <p className="mt-2 text-xs text-destructive">
          This suggestion was dropped automatically — it could not be verified against your
          résumé and can never be applied.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {editing ? (
            <div className="flex flex-col gap-2">
              <Textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" disabled={isPending} onClick={() => decide("EDITED", editedText)}>
                  Save edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={isPending} onClick={() => decide("ACCEPTED")}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => decide("REJECTED")}
              >
                Reject
              </Button>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => setEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

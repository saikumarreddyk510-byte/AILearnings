"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationDetailsAction } from "@/server/actions/applications";

interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
}

interface InterviewDate {
  date: string;
  note?: string;
}

/** "2026-09-10 - Phone screen" per line <-> [{date, note}] — same newline-per-item convention as the résumé fact editor's bullet lists. */
function interviewDatesToText(dates: InterviewDate[]): string {
  return dates.map((d) => (d.note ? `${d.date} - ${d.note}` : d.date)).join("\n");
}
function textToInterviewDates(text: string): InterviewDate[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, ...rest] = line.split(" - ");
      return rest.length > 0 ? { date: date.trim(), note: rest.join(" - ").trim() } : { date: date.trim() };
    });
}

export function ApplicationDetailsForm({
  applicationId,
  initialNotes,
  initialFollowUpDate,
  initialContactInfo,
  initialInterviewDates,
}: {
  applicationId: string;
  initialNotes: string;
  initialFollowUpDate: string;
  initialContactInfo: ContactInfo;
  initialInterviewDates: InterviewDate[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [followUpDate, setFollowUpDate] = useState(initialFollowUpDate);
  const [contactName, setContactName] = useState(initialContactInfo.name ?? "");
  const [contactEmail, setContactEmail] = useState(initialContactInfo.email ?? "");
  const [contactPhone, setContactPhone] = useState(initialContactInfo.phone ?? "");
  const [interviewDatesText, setInterviewDatesText] = useState(
    interviewDatesToText(initialInterviewDates)
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      const ok = await updateApplicationDetailsAction(applicationId, {
        notes,
        followUpDate: followUpDate || null,
        contactInfo: { name: contactName, email: contactEmail, phone: contactPhone },
        interviewDates: textToInterviewDates(interviewDatesText),
      });
      if (ok) {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="followUpDate">Follow-up date</Label>
        <Input
          id="followUpDate"
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactName">Contact name</Label>
          <Input id="contactName" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interviewDates">
          Interview dates (one per line, optionally &quot;date - note&quot;)
        </Label>
        <Textarea
          id="interviewDates"
          value={interviewDatesText}
          onChange={(e) => setInterviewDatesText(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save tracking details"}
        </Button>
        {saved && !isPending && (
          <span className="text-sm text-muted-foreground">Saved.</span>
        )}
      </div>
    </div>
  );
}

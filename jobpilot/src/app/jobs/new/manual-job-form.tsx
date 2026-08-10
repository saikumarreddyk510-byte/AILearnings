"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKPLACE_TYPES, EMPLOYMENT_TYPES } from "@/lib/enums";
import { createManualJobAction } from "@/server/actions/jobs";

export function ManualJobForm() {
  const [state, action, pending] = useActionState(createManualJobAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <Label>How are you adding this job?</Label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="entryMode" value="MANUAL_URL" defaultChecked />
            I have a link to reference
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="entryMode" value="MANUAL_PASTE" />
            I&apos;m pasting the full posting
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" required />
          {state?.errors?.company && (
            <p className="text-sm text-destructive">{state.errors.company[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
          {state?.errors?.title && (
            <p className="text-sm text-destructive">{state.errors.title[0]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sourceUrl">Original posting URL</Label>
        <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://…" required />
        {state?.errors?.sourceUrl && (
          <p className="text-sm text-destructive">{state.errors.sourceUrl[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="applicationUrl">Application URL (optional)</Label>
        <Input id="applicationUrl" name="applicationUrl" type="url" placeholder="https://…" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Job description</Label>
        <Textarea id="description" name="description" rows={8} required />
        {state?.errors?.description && (
          <p className="text-sm text-destructive">{state.errors.description[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="e.g. Austin, TX or Remote" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Workplace type</Label>
          <Select name="workplaceType">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Not specified" />
            </SelectTrigger>
            <SelectContent>
              {WORKPLACE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Employment type</Label>
          <Select name="employmentType">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Not specified" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salaryMin">Salary min</Label>
          <Input id="salaryMin" name="salaryMin" type="number" min={0} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salaryMax">Salary max</Label>
          <Input id="salaryMax" name="salaryMax" type="number" min={0} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="requiredSkills">Required skills (one per line)</Label>
          <Textarea id="requiredSkills" name="requiredSkills" rows={3} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="preferredSkills">Preferred skills (one per line)</Label>
          <Textarea id="preferredSkills" name="preferredSkills" rows={3} />
        </div>
      </div>

      {state?.message && <p className="text-sm text-destructive">{state.message}</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Adding…" : "Add job"}
      </Button>
    </form>
  );
}

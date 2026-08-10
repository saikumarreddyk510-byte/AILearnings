"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  SEARCH_FREQUENCIES,
  WORKPLACE_TYPES,
} from "@/lib/enums";
import type { SearchProfileInput } from "@/lib/jobs/schemas";
import {
  createSearchProfileAction,
  deleteSearchProfileAction,
  updateSearchProfileAction,
} from "@/server/actions/search-profiles";

const DEFAULT_VALUE: SearchProfileInput = {
  name: "",
  targetRoleTitles: [],
  alternateRoleTitles: [],
  requiredSkills: [],
  optionalSkills: [],
  locations: [],
  workplaceTypes: [],
  employmentTypes: [],
  preferredIndustries: [],
  excludedCompanies: [],
  requiredKeywords: [],
  excludedKeywords: [],
  sponsorshipRequired: false,
  searchFrequency: "DAILY",
};

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function SearchProfileForm({
  profileId,
  initial,
}: {
  profileId?: string;
  initial?: SearchProfileInput;
}) {
  const router = useRouter();
  const base = initial ?? DEFAULT_VALUE;

  const [name, setName] = useState(base.name);
  const [targetRoleTitles, setTargetRoleTitles] = useState(base.targetRoleTitles.join("\n"));
  const [alternateRoleTitles, setAlternateRoleTitles] = useState(
    (base.alternateRoleTitles ?? []).join("\n")
  );
  const [requiredSkills, setRequiredSkills] = useState((base.requiredSkills ?? []).join("\n"));
  const [optionalSkills, setOptionalSkills] = useState((base.optionalSkills ?? []).join("\n"));
  const [locations, setLocations] = useState((base.locations ?? []).join("\n"));
  const [workplaceTypes, setWorkplaceTypes] = useState<string[]>(base.workplaceTypes ?? []);
  const [minSalary, setMinSalary] = useState(base.minSalary?.toString() ?? "");
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(base.employmentTypes ?? []);
  const [experienceLevel, setExperienceLevel] = useState(base.experienceLevel ?? "");
  const [preferredIndustries, setPreferredIndustries] = useState(
    (base.preferredIndustries ?? []).join("\n")
  );
  const [excludedCompanies, setExcludedCompanies] = useState(
    (base.excludedCompanies ?? []).join("\n")
  );
  const [requiredKeywords, setRequiredKeywords] = useState(
    (base.requiredKeywords ?? []).join("\n")
  );
  const [excludedKeywords, setExcludedKeywords] = useState(
    (base.excludedKeywords ?? []).join("\n")
  );
  const [sponsorshipRequired, setSponsorshipRequired] = useState(base.sponsorshipRequired);
  const [maxPostingAgeDays, setMaxPostingAgeDays] = useState(
    base.maxPostingAgeDays?.toString() ?? ""
  );
  const [searchFrequency, setSearchFrequency] = useState(base.searchFrequency);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleInArray(arr: string[], value: string, setArr: (v: string[]) => void) {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  function buildInput(): SearchProfileInput {
    return {
      name,
      targetRoleTitles: linesToArray(targetRoleTitles),
      alternateRoleTitles: linesToArray(alternateRoleTitles),
      requiredSkills: linesToArray(requiredSkills),
      optionalSkills: linesToArray(optionalSkills),
      locations: linesToArray(locations),
      workplaceTypes: workplaceTypes as SearchProfileInput["workplaceTypes"],
      minSalary: minSalary ? Number(minSalary) : undefined,
      employmentTypes: employmentTypes as SearchProfileInput["employmentTypes"],
      experienceLevel: (experienceLevel || undefined) as SearchProfileInput["experienceLevel"],
      preferredIndustries: linesToArray(preferredIndustries),
      excludedCompanies: linesToArray(excludedCompanies),
      requiredKeywords: linesToArray(requiredKeywords),
      excludedKeywords: linesToArray(excludedKeywords),
      sponsorshipRequired,
      maxPostingAgeDays: maxPostingAgeDays ? Number(maxPostingAgeDays) : undefined,
      searchFrequency: searchFrequency as SearchProfileInput["searchFrequency"],
    };
  }

  function handleSubmit() {
    setError(null);
    const input = buildInput();
    startTransition(async () => {
      const result = profileId
        ? await updateSearchProfileAction(profileId, input)
        : await createSearchProfileAction(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/search-profiles");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!profileId) return;
    startTransition(async () => {
      const result = await deleteSearchProfileAction(profileId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/search-profiles");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Profile name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="targetRoleTitles">Target role titles (one per line)</Label>
        <Textarea
          id="targetRoleTitles"
          rows={3}
          value={targetRoleTitles}
          onChange={(e) => setTargetRoleTitles(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Workplace type</Label>
        <div className="flex gap-4">
          {WORKPLACE_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 text-sm">
              <Switch
                checked={workplaceTypes.includes(type)}
                onCheckedChange={() => toggleInArray(workplaceTypes, type, setWorkplaceTypes)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Employment type</Label>
          <div className="flex flex-wrap gap-3">
            {EMPLOYMENT_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <Switch
                  checked={employmentTypes.includes(type)}
                  onCheckedChange={() =>
                    toggleInArray(employmentTypes, type, setEmploymentTypes)
                  }
                />
                {type}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Experience level</Label>
          <Select value={experienceLevel} onValueChange={(v) => setExperienceLevel(String(v ?? ""))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="minSalary">Minimum salary</Label>
          <Input
            id="minSalary"
            type="number"
            min={0}
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="maxPostingAgeDays">Max posting age (days)</Label>
          <Input
            id="maxPostingAgeDays"
            type="number"
            min={0}
            value={maxPostingAgeDays}
            onChange={(e) => setMaxPostingAgeDays(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="locations">Locations (one per line)</Label>
        <Textarea
          id="locations"
          rows={2}
          value={locations}
          onChange={(e) => setLocations(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={sponsorshipRequired}
          onCheckedChange={setSponsorshipRequired}
          id="sponsorshipRequired"
        />
        <Label htmlFor="sponsorshipRequired">Requires visa sponsorship</Label>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Search frequency</Label>
        <Select
          value={searchFrequency}
          onValueChange={(v) =>
            setSearchFrequency((v as SearchProfileInput["searchFrequency"]) ?? "DAILY")
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_FREQUENCIES.map((freq) => (
              <SelectItem key={freq} value={freq}>
                {freq}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Accordion defaultValue={[]}>
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced filters</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="alternateRoleTitles">
                  Alternate role titles (one per line)
                </Label>
                <Textarea
                  id="alternateRoleTitles"
                  rows={2}
                  value={alternateRoleTitles}
                  onChange={(e) => setAlternateRoleTitles(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="requiredSkills">Required skills (one per line)</Label>
                  <Textarea
                    id="requiredSkills"
                    rows={3}
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="optionalSkills">Optional skills (one per line)</Label>
                  <Textarea
                    id="optionalSkills"
                    rows={3}
                    value={optionalSkills}
                    onChange={(e) => setOptionalSkills(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="preferredIndustries">
                  Preferred industries (one per line)
                </Label>
                <Textarea
                  id="preferredIndustries"
                  rows={2}
                  value={preferredIndustries}
                  onChange={(e) => setPreferredIndustries(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="excludedCompanies">Excluded companies (one per line)</Label>
                <Textarea
                  id="excludedCompanies"
                  rows={2}
                  value={excludedCompanies}
                  onChange={(e) => setExcludedCompanies(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="requiredKeywords">Required keywords (one per line)</Label>
                  <Textarea
                    id="requiredKeywords"
                    rows={2}
                    value={requiredKeywords}
                    onChange={(e) => setRequiredKeywords(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="excludedKeywords">Excluded keywords (one per line)</Label>
                  <Textarea
                    id="excludedKeywords"
                    rows={2}
                    value={excludedKeywords}
                    onChange={(e) => setExcludedKeywords(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving…" : profileId ? "Save changes" : "Create search profile"}
        </Button>
        {profileId && (
          <Button variant="outline" onClick={handleDelete} disabled={isPending}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

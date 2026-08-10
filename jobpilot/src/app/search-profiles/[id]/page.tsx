import { notFound } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { getSearchProfileByIdForUser } from "@/server/data/search-profiles";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SearchProfileInput } from "@/lib/jobs/schemas";
import type {
  EmploymentType,
  ExperienceLevel,
  SearchFrequency,
  WorkplaceType,
} from "@/lib/enums";
import { SearchProfileForm } from "../search-profile-form";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default async function EditSearchProfilePage(
  props: PageProps<"/search-profiles/[id]">
) {
  const { id } = await props.params;
  const userId = await requireUserId();

  const profile = await getSearchProfileByIdForUser(id, userId);
  if (!profile) notFound();

  const initial: SearchProfileInput = {
    name: profile.name,
    targetRoleTitles: asStringArray(profile.targetRoleTitles),
    alternateRoleTitles: asStringArray(profile.alternateRoleTitles),
    requiredSkills: asStringArray(profile.requiredSkills),
    optionalSkills: asStringArray(profile.optionalSkills),
    locations: asStringArray(profile.locations),
    workplaceTypes: asStringArray(profile.workplaceTypes) as WorkplaceType[],
    minSalary: profile.minSalary ?? undefined,
    employmentTypes: asStringArray(profile.employmentTypes) as EmploymentType[],
    experienceLevel: (profile.experienceLevel as ExperienceLevel | null) ?? undefined,
    preferredIndustries: asStringArray(profile.preferredIndustries),
    excludedCompanies: asStringArray(profile.excludedCompanies),
    requiredKeywords: asStringArray(profile.requiredKeywords),
    excludedKeywords: asStringArray(profile.excludedKeywords),
    sponsorshipRequired: profile.sponsorshipRequired,
    maxPostingAgeDays: profile.maxPostingAgeDays ?? undefined,
    searchFrequency: profile.searchFrequency as SearchFrequency,
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold">{profile.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit search profile</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchProfileForm profileId={profile.id} initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { requireUserId } from "@/server/auth/session";
import { listSearchProfilesForUser } from "@/server/data/search-profiles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchProfileForm } from "./search-profile-form";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default async function SearchProfilesPage() {
  const userId = await requireUserId();
  const profiles = await listSearchProfilesForUser(userId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Search profiles</h1>
        <p className="text-muted-foreground">
          Describe the roles you want — this powers job matching in a later
          phase.
        </p>
      </div>

      {profiles.length > 0 && (
        <div className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <Link key={profile.id} href={`/search-profiles/${profile.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base">{profile.name}</CardTitle>
                  <CardDescription>
                    {asStringArray(profile.targetRoleTitles).join(", ") || "No roles set"}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New search profile</CardTitle>
        </CardHeader>
        <CardContent>
          <SearchProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}

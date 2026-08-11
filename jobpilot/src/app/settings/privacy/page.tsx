import { requireUserId } from "@/server/auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAccountForm } from "./delete-account-form";

export default async function PrivacyPage() {
  await requireUserId();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Privacy &amp; data management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What we store and how</CardTitle>
          <CardDescription>
            Provider tokens and API keys stay in server-only environment variables, never
            sent to your browser. Logs never contain your résumé content, job
            descriptions, or credentials — AI-execution records store only counts and
            ids. Every query is scoped to your account; one user can never read
            another&apos;s data. See <span className="whitespace-nowrap">ARCHITECTURE.md</span>{" "}
            for the full design.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export your data</CardTitle>
          <CardDescription>
            Download everything associated with your account — résumé, facts, search
            profiles, jobs you added, matches, tailored résumés, cover letters, and
            applications — as a single JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<a href="/settings/privacy/export" />}>Download my data</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete account</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm />
        </CardContent>
      </Card>
    </div>
  );
}

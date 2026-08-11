import Link from "next/link";
import { auth } from "@/server/auth/config";
import { requireUserId } from "@/server/auth/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  await requireUserId();
  const session = await auth();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Settings and integrations</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p>{session?.user?.name ?? "—"}</p>
          <p className="text-muted-foreground">{session?.user?.email}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job sources</CardTitle>
          <CardDescription>
            Job sources are currently developer-configured via environment variables —
            there is no per-user integration UI yet. The mock provider and manual
            entry/CSV import are available to every account; a real permitted job-search
            API is the documented extension point (see{" "}
            <span className="whitespace-nowrap">ARCHITECTURE.md</span>).
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Privacy &amp; data</CardTitle>
            <CardDescription>Export your data or delete your account.</CardDescription>
          </div>
          <Button size="sm" render={<Link href="/settings/privacy" />}>
            Manage
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}

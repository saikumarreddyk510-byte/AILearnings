import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserId } from "@/server/auth/session";
import { ManualJobForm } from "./manual-job-form";

export default async function NewJobPage() {
  await requireUserId();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Add a job</h1>
        <p className="text-muted-foreground">
          We never fetch or scrape a URL automatically — paste the details
          you found yourself.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
          <CardDescription>
            Only visible to you, unless it turns out to match one you (or
            the sample catalog) already added.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualJobForm />
        </CardContent>
      </Card>
    </div>
  );
}

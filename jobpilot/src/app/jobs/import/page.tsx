import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUserId } from "@/server/auth/session";
import { JOB_CSV_COLUMNS, JOB_CSV_MAX_ROWS, JOB_CSV_MAX_UPLOAD_BYTES } from "@/lib/jobs/constants";
import { CsvImportForm } from "./csv-import-form";

export default async function ImportJobsPage() {
  await requireUserId();
  const maxMb = (JOB_CSV_MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Import jobs from CSV</h1>
        <p className="text-muted-foreground">
          Up to {maxMb}MB, {JOB_CSV_MAX_ROWS} rows per import. Imported jobs
          are only visible to you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Column reference</CardTitle>
          <CardDescription>Required columns are marked with *.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-1.5 pr-4">Column</th>
                <th className="py-1.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {JOB_CSV_COLUMNS.map((column) => (
                <tr key={column.header} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 font-mono text-xs">
                    {column.header}
                    {column.required ? "*" : ""}
                  </td>
                  <td className="py-1.5 text-muted-foreground">{column.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <CsvImportForm />
        </CardContent>
      </Card>
    </div>
  );
}

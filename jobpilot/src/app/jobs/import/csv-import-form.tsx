"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { importJobsCsvAction } from "@/server/actions/jobs";

export function CsvImportForm() {
  const [state, action, pending] = useActionState(importJobsCsvAction, undefined);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="file">CSV file</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept="text/csv,.csv"
            required
            className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          {state?.errors?.file && (
            <p className="text-sm text-destructive">{state.errors.file[0]}</p>
          )}
        </div>
        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Importing…" : "Import"}
        </Button>
      </form>

      {state?.summary && (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{state.summary.created} created</Badge>
            <Badge variant="secondary">{state.summary.duplicates} already existed</Badge>
            {state.summary.failed.length > 0 && (
              <Badge variant="destructive">{state.summary.failed.length} failed</Badge>
            )}
          </div>
          {state.summary.failed.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {state.summary.failed.map((failure) => (
                <li key={failure.row}>
                  Row {failure.row}: {failure.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

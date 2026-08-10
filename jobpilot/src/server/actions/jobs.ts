"use server";

import { redirect } from "next/navigation";
import { requireUserId } from "@/server/auth/session";
import { ManualJobEntrySchema } from "@/lib/jobs/schemas";
import { normalizeJobInput } from "@/lib/jobs/normalize";
import { parseJobsCsv } from "@/lib/jobs/csv";
import {
  createJobsFromCsvForUser,
  createManualJobForUser,
  type CsvImportSummary,
} from "@/server/data/jobs";

function splitLines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ManualJobFormState =
  | { errors?: Partial<Record<string, string[]>>; message?: string }
  | undefined;

export async function createManualJobAction(
  _prevState: ManualJobFormState,
  formData: FormData
): Promise<ManualJobFormState> {
  const userId = await requireUserId();

  const parsed = ManualJobEntrySchema.safeParse({
    entryMode: formData.get("entryMode"),
    sourceUrl: formData.get("sourceUrl"),
    company: formData.get("company"),
    title: formData.get("title"),
    description: formData.get("description"),
    applicationUrl: formData.get("applicationUrl") || undefined,
    location: formData.get("location") || undefined,
    workplaceType: formData.get("workplaceType") || undefined,
    employmentType: formData.get("employmentType") || undefined,
    salaryMin: formData.get("salaryMin") || undefined,
    salaryMax: formData.get("salaryMax") || undefined,
    requiredSkills: splitLines(formData.get("requiredSkills")),
    preferredSkills: splitLines(formData.get("preferredSkills")),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const normalized = normalizeJobInput({
    company: parsed.data.company,
    title: parsed.data.title,
    description: parsed.data.description,
    sourceUrl: parsed.data.sourceUrl,
    applicationUrl: parsed.data.applicationUrl,
    location: parsed.data.location,
    workplaceType: parsed.data.workplaceType,
    employmentType: parsed.data.employmentType,
    salaryMin: parsed.data.salaryMin,
    salaryMax: parsed.data.salaryMax,
    requiredSkills: parsed.data.requiredSkills,
    preferredSkills: parsed.data.preferredSkills,
  });

  const result = await createManualJobForUser(userId, normalized, parsed.data.entryMode);

  redirect(`/jobs/${result.job.id}${result.duplicate ? "?duplicate=1" : ""}`);
}

export type ImportJobsFormState =
  | { errors?: { file?: string[] }; summary?: CsvImportSummary }
  | undefined;

export async function importJobsCsvAction(
  _prevState: ImportJobsFormState,
  formData: FormData
): Promise<ImportJobsFormState> {
  const userId = await requireUserId();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { errors: { file: ["Please choose a CSV file to upload."] } };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = parseJobsCsv(buffer);
  if (!parsed.ok) {
    return { errors: { file: [parsed.error] } };
  }

  const normalizedRows = parsed.result.rows.map(({ row, data }) => ({
    row,
    normalized: normalizeJobInput({
      company: data.company,
      title: data.title,
      description: data.description,
      sourceUrl: data.source_url,
      applicationUrl: data.application_url,
      location: data.location,
      workplaceType: data.workplace_type,
      employmentType: data.employment_type,
      salaryMin: data.salary_min,
      salaryMax: data.salary_max,
      requiredSkills: data.required_skills
        ?.split(";")
        .map((s) => s.trim())
        .filter(Boolean),
      preferredSkills: data.preferred_skills
        ?.split(";")
        .map((s) => s.trim())
        .filter(Boolean),
      datePosted: data.date_posted,
    }),
  }));

  const summary = await createJobsFromCsvForUser(userId, normalizedRows);
  // Merge validation-stage failures (bad cells) with DB-stage failures
  // (rare — e.g. a transient write error), sorted back into row order.
  summary.failed = [...parsed.result.invalidRows, ...summary.failed].sort(
    (a, b) => a.row - b.row
  );

  return { summary };
}

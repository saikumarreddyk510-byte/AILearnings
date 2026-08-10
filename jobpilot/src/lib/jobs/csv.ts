import "server-only";
import { parse } from "csv-parse/sync";
import { CsvJobRowSchema, type CsvJobRow } from "@/lib/jobs/schemas";
import { JOB_CSV_MAX_ROWS, JOB_CSV_MAX_UPLOAD_BYTES } from "@/lib/jobs/constants";

export interface ParseJobsCsvResult {
  // Each valid row carries its original 1-indexed (header-inclusive) row
  // number, since invalid rows are filtered out of this array — a
  // recomputed index here would silently misattribute row numbers to
  // anything reported later (e.g. a DB-stage failure) once any row fails
  // validation.
  rows: { row: number; data: CsvJobRow }[];
  invalidRows: { row: number; message: string }[];
}

export type ParseJobsCsvOutcome =
  | { ok: true; result: ParseJobsCsvResult }
  | { ok: false; error: string };

/**
 * Parses + validates a job-import CSV, cheapest checks first (same
 * precedent as src/lib/resume/validate-upload.ts): size before parsing,
 * row count before per-row validation. A single bad row is collected into
 * `invalidRows`, never thrown — it must not abort the rest of the batch.
 */
export function parseJobsCsv(buffer: Buffer): ParseJobsCsvOutcome {
  if (buffer.length === 0) {
    return { ok: false, error: "The CSV file is empty." };
  }
  if (buffer.length > JOB_CSV_MAX_UPLOAD_BYTES) {
    const limitMb = (JOB_CSV_MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
    return { ok: false, error: `File exceeds the ${limitMb}MB limit.` };
  }

  let records: unknown[];
  try {
    records = parse(buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    return { ok: false, error: "Could not parse this file as CSV." };
  }

  if (records.length === 0) {
    return { ok: false, error: "No rows found in the CSV." };
  }
  if (records.length > JOB_CSV_MAX_ROWS) {
    return {
      ok: false,
      error: `Too many rows (max ${JOB_CSV_MAX_ROWS} per import).`,
    };
  }

  const rows: { row: number; data: CsvJobRow }[] = [];
  const invalidRows: { row: number; message: string }[] = [];

  records.forEach((record, index) => {
    const parsed = CsvJobRowSchema.safeParse(record);
    const rowNumber = index + 2; // +1 for header row, +1 for 1-indexing
    if (parsed.success) {
      rows.push({ row: rowNumber, data: parsed.data });
    } else {
      const firstIssue = parsed.error.issues[0];
      invalidRows.push({
        row: rowNumber,
        message: firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Invalid row.",
      });
    }
  });

  return { ok: true, result: { rows, invalidRows } };
}

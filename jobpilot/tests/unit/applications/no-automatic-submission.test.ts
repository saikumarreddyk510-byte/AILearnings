import { describe, expect, it } from "vitest";
import { listRegisteredJobSources } from "@/lib/job-sources/registry";

describe("no registered JobSource supports automatic application submission", () => {
  it(
    "listRegisteredJobSources().every(s => !s.supportsApplicationSubmission()) — " +
      "this is currently vacuously true (no adapter with an approved submission API " +
      "exists yet), which is exactly what makes 'unknown submission results are not " +
      "automatically retried' true today: there is no automatic-submission code path " +
      "for anything to retry. A future approved-API adapter that DOES support " +
      "submission must implement spec section H's second half (exact payload preview, " +
      "an explicit immediate 'Confirm and submit', logging the response and external " +
      "application id, and never auto-retrying an uncertain result) with its own " +
      "dedicated test — this assertion will need to be updated to exclude that adapter " +
      "specifically, not relaxed generally.",
    () => {
      const sources = listRegisteredJobSources();
      expect(sources.length).toBeGreaterThan(0);
      expect(sources.every((s) => !s.supportsApplicationSubmission())).toBe(true);
    }
  );
});

import { describe, expect, it } from "vitest";
import { parseJobsCsv } from "@/lib/jobs/csv";
import { JOB_CSV_MAX_ROWS } from "@/lib/jobs/constants";

const HEADER = "title,company,description,source_url";

describe("parseJobsCsv", () => {
  it("parses a valid multi-row CSV", () => {
    const csv = [
      HEADER,
      "Engineer,Acme,Build things,https://example.com/1",
      "Designer,Acme,Design things,https://example.com/2",
    ].join("\n");

    const outcome = parseJobsCsv(Buffer.from(csv));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.rows).toHaveLength(2);
      expect(outcome.result.invalidRows).toHaveLength(0);
      expect(outcome.result.rows[0].row).toBe(2);
      expect(outcome.result.rows[1].row).toBe(3);
    }
  });

  it("collects a row missing a required column as invalid without dropping others", () => {
    const csv = [
      HEADER,
      "Engineer,Acme,Build things,https://example.com/1",
      ",Acme,Missing title,https://example.com/2",
      "Designer,Acme,Design things,https://example.com/3",
    ].join("\n");

    const outcome = parseJobsCsv(Buffer.from(csv));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.rows).toHaveLength(2);
      expect(outcome.result.invalidRows).toHaveLength(1);
      expect(outcome.result.invalidRows[0].row).toBe(3);
    }
  });

  it("rejects a structurally malformed CSV at the top level", () => {
    const outcome = parseJobsCsv(Buffer.from('title,company\n"unterminated quote'));
    expect(outcome.ok).toBe(false);
  });

  it("rejects an empty file", () => {
    const outcome = parseJobsCsv(Buffer.from(""));
    expect(outcome.ok).toBe(false);
  });

  it("rejects a CSV with more rows than the limit", () => {
    const rows = Array.from(
      { length: JOB_CSV_MAX_ROWS + 1 },
      (_, i) => `Engineer ${i},Acme,Build things,https://example.com/${i}`
    );
    const csv = [HEADER, ...rows].join("\n");

    const outcome = parseJobsCsv(Buffer.from(csv));
    expect(outcome.ok).toBe(false);
  });
});

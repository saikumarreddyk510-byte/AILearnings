import { describe, expect, it } from "vitest";
import {
  ResumeFactContentSchemaByType,
  parseFactContent,
} from "@/lib/resume/fact-schemas";
import { RESUME_FACT_TYPES } from "@/lib/enums";

describe("ResumeFactContentSchemaByType", () => {
  it("has a schema for every RESUME_FACT_TYPES entry", () => {
    for (const type of RESUME_FACT_TYPES) {
      expect(ResumeFactContentSchemaByType[type]).toBeDefined();
    }
  });

  it("accepts a valid CONTACT fact", () => {
    expect(() =>
      parseFactContent("CONTACT", {
        name: "Jane Doe",
        email: "jane@example.com",
        links: [],
      })
    ).not.toThrow();
  });

  it("accepts a valid WORK_HISTORY fact", () => {
    expect(() =>
      parseFactContent("WORK_HISTORY", {
        company: "Acme",
        title: "Engineer",
        startDate: "2020-01",
        bullets: ["Did things"],
      })
    ).not.toThrow();
  });

  it("rejects a WORK_HISTORY fact missing a required field", () => {
    expect(() =>
      parseFactContent("WORK_HISTORY", { title: "Engineer", startDate: "2020-01" })
    ).toThrow();
  });

  it("rejects a SKILL fact with an empty name", () => {
    expect(() => parseFactContent("SKILL", { name: "" })).toThrow();
  });
});

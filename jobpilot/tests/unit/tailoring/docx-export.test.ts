import { describe, expect, it } from "vitest";
import { buildResumeDocx } from "@/lib/documents/resume-docx-export";
import { buildCoverLetterDocx } from "@/lib/documents/cover-letter-docx-export";
import { sniffFileKind } from "@/lib/resume/file-signature";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";

const facts: ResumeVersionSnapshotFact[] = [
  {
    id: "1",
    type: "CONTACT",
    content: { name: "Jamie Doe", email: "jamie@example.com" },
    verified: true,
    locked: false,
    sortOrder: 0,
  },
  {
    id: "2",
    type: "SUMMARY",
    content: { text: "Backend engineer." },
    verified: true,
    locked: false,
    sortOrder: 0,
  },
  {
    id: "3",
    type: "SKILL",
    content: { name: "Python" },
    verified: true,
    locked: false,
    sortOrder: 0,
  },
  {
    id: "4",
    type: "WORK_HISTORY",
    content: {
      title: "Engineer",
      company: "Acme",
      startDate: "2020",
      current: true,
      bullets: ["Built things"],
    },
    verified: true,
    locked: false,
    sortOrder: 0,
  },
];

describe("buildResumeDocx", () => {
  it("produces a buffer that round-trips as a valid docx", async () => {
    const buffer = await buildResumeDocx({ facts });
    expect(buffer.length).toBeGreaterThan(0);
    const kind = await sniffFileKind(buffer);
    expect(kind).toBe("docx");
  });

  it("handles an empty fact list without throwing", async () => {
    const buffer = await buildResumeDocx({ facts: [] });
    const kind = await sniffFileKind(buffer);
    expect(kind).toBe("docx");
  });
});

describe("buildCoverLetterDocx", () => {
  it("produces a buffer that round-trips as a valid docx", async () => {
    const buffer = await buildCoverLetterDocx("Dear hiring manager,\n\nI'm excited to apply.");
    const kind = await sniffFileKind(buffer);
    expect(kind).toBe("docx");
  });
});

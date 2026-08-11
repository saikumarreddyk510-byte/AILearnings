import "server-only";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";

/**
 * Renders a tailored résumé's assembled content (src/lib/tailoring/
 * assemble.ts's output) into a plain, ATS-friendly DOCX — no tables, text
 * boxes, columns, or headers/footers holding content, since those commonly
 * confuse applicant-tracking-system parsers (spec F: "Produce an
 * ATS-friendly résumé"). Section order: CONTACT → SUMMARY → SKILLS →
 * WORK HISTORY → PROJECTS → EDUCATION → CERTIFICATIONS.
 */
export async function buildResumeDocx(content: {
  facts: ResumeVersionSnapshotFact[];
}): Promise<Buffer> {
  const byType = (type: ResumeVersionSnapshotFact["type"]) =>
    content.facts
      .filter((f) => f.type === type)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);

  const paragraphs: Paragraph[] = [];

  for (const fact of byType("CONTACT")) {
    const c = fact.content as {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    if (c.name) {
      paragraphs.push(
        new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(c.name)] })
      );
    }
    const line = [c.email, c.phone, c.location].filter(Boolean).join(" · ");
    if (line) paragraphs.push(new Paragraph(line));
  }

  const summaries = byType("SUMMARY");
  if (summaries.length > 0) {
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Summary")] }));
    for (const fact of summaries) {
      const c = fact.content as { text?: string };
      if (c.text) paragraphs.push(new Paragraph(c.text));
    }
  }

  const skills = byType("SKILL");
  if (skills.length > 0) {
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Skills")] }));
    const names = skills
      .map((f) => (f.content as { name?: string }).name)
      .filter((n): n is string => !!n);
    paragraphs.push(new Paragraph(names.join(", ")));
  }

  const workHistory = byType("WORK_HISTORY");
  if (workHistory.length > 0) {
    paragraphs.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Work History")] })
    );
    for (const fact of workHistory) {
      const c = fact.content as {
        title?: string;
        company?: string;
        location?: string;
        startDate?: string;
        endDate?: string;
        current?: boolean;
        bullets?: string[];
      };
      const dateRange = `${c.startDate ?? ""} – ${c.current ? "Present" : (c.endDate ?? "")}`;
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun(`${c.title ?? ""}, ${c.company ?? ""} (${dateRange})`)],
        })
      );
      for (const bullet of c.bullets ?? []) {
        paragraphs.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
      }
    }
  }

  const projects = byType("PROJECT");
  if (projects.length > 0) {
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Projects")] }));
    for (const fact of projects) {
      const c = fact.content as { name?: string; description?: string; bullets?: string[] };
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(c.name ?? "")] }));
      if (c.description) paragraphs.push(new Paragraph(c.description));
      for (const bullet of c.bullets ?? []) {
        paragraphs.push(new Paragraph({ text: bullet, bullet: { level: 0 } }));
      }
    }
  }

  const education = byType("EDUCATION");
  if (education.length > 0) {
    paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Education")] }));
    for (const fact of education) {
      const c = fact.content as {
        institution?: string;
        degree?: string;
        fieldOfStudy?: string;
        endDate?: string;
      };
      const line = [c.degree, c.fieldOfStudy].filter(Boolean).join(", ");
      paragraphs.push(
        new Paragraph(`${c.institution ?? ""}${line ? " — " + line : ""}${c.endDate ? " (" + c.endDate + ")" : ""}`)
      );
    }
  }

  const certifications = byType("CERTIFICATION");
  if (certifications.length > 0) {
    paragraphs.push(
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Certifications")] })
    );
    for (const fact of certifications) {
      const c = fact.content as { name?: string; issuer?: string; issueDate?: string };
      const line = [c.name, c.issuer].filter(Boolean).join(" — ");
      paragraphs.push(new Paragraph(`${line}${c.issueDate ? " (" + c.issueDate + ")" : ""}`));
    }
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc);
}

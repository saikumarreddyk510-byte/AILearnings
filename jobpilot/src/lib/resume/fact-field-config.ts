import type { ResumeFactType } from "@/lib/enums";

/**
 * UI-only metadata describing how to render/edit each fact type's fields
 * generically in <FactEditor>. This is presentation convenience, not
 * validation — the actual contract lives in fact-schemas.ts and is what
 * the server enforces regardless of what the UI sends.
 */
export type FactFieldKind = "text" | "textarea" | "boolean" | "bulletList";

export interface FactFieldConfig {
  key: string;
  label: string;
  kind: FactFieldKind;
}

export const FACT_TYPE_LABELS: Record<ResumeFactType, string> = {
  CONTACT: "Contact information",
  SUMMARY: "Summary",
  SKILL: "Skills",
  WORK_HISTORY: "Work history",
  PROJECT: "Projects",
  EDUCATION: "Education",
  CERTIFICATION: "Certifications",
};

/** Whether the UI treats this type as a single-entry section (no "Add another"). */
export const FACT_TYPE_IS_SINGLETON: Record<ResumeFactType, boolean> = {
  CONTACT: true,
  SUMMARY: true,
  SKILL: false,
  WORK_HISTORY: false,
  PROJECT: false,
  EDUCATION: false,
  CERTIFICATION: false,
};

export const FACT_FIELD_CONFIG: Record<ResumeFactType, FactFieldConfig[]> = {
  CONTACT: [
    { key: "name", label: "Name", kind: "text" },
    { key: "email", label: "Email", kind: "text" },
    { key: "phone", label: "Phone", kind: "text" },
    { key: "location", label: "Location", kind: "text" },
  ],
  SUMMARY: [{ key: "text", label: "Summary", kind: "textarea" }],
  SKILL: [
    { key: "name", label: "Skill", kind: "text" },
    { key: "category", label: "Category", kind: "text" },
  ],
  WORK_HISTORY: [
    { key: "company", label: "Company", kind: "text" },
    { key: "title", label: "Title", kind: "text" },
    { key: "location", label: "Location", kind: "text" },
    { key: "startDate", label: "Start date", kind: "text" },
    { key: "endDate", label: "End date", kind: "text" },
    { key: "current", label: "Current position", kind: "boolean" },
    { key: "bullets", label: "Highlights (one per line)", kind: "bulletList" },
  ],
  PROJECT: [
    { key: "name", label: "Project name", kind: "text" },
    { key: "description", label: "Description", kind: "textarea" },
    { key: "url", label: "URL", kind: "text" },
    { key: "bullets", label: "Highlights (one per line)", kind: "bulletList" },
    { key: "technologies", label: "Technologies (one per line)", kind: "bulletList" },
  ],
  EDUCATION: [
    { key: "institution", label: "Institution", kind: "text" },
    { key: "degree", label: "Degree", kind: "text" },
    { key: "fieldOfStudy", label: "Field of study", kind: "text" },
    { key: "startDate", label: "Start date", kind: "text" },
    { key: "endDate", label: "End date", kind: "text" },
    { key: "gpa", label: "GPA", kind: "text" },
  ],
  CERTIFICATION: [
    { key: "name", label: "Name", kind: "text" },
    { key: "issuer", label: "Issuer", kind: "text" },
    { key: "issueDate", label: "Issue date", kind: "text" },
    { key: "expirationDate", label: "Expiration date", kind: "text" },
    { key: "credentialId", label: "Credential ID", kind: "text" },
    { key: "url", label: "URL", kind: "text" },
  ],
};

/** A blank content object for a new draft fact of the given type. */
export function blankFactContent(type: ResumeFactType): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const field of FACT_FIELD_CONFIG[type]) {
    if (field.kind === "boolean") content[field.key] = false;
    else if (field.kind === "bulletList") content[field.key] = [];
    else content[field.key] = "";
  }
  return content;
}

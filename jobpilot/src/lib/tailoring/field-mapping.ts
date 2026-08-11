import type { TailorableFactType } from "@/lib/enums";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";

/**
 * Single source of truth for "which content field a tailorable fact type
 * edits, and how." Used by assemble.ts (to apply an accepted/edited change)
 * and by the review UI (to compute the true "original" text to diff
 * against — never the AI's own possibly-inaccurate `originalText` echo,
 * since assemble.ts never trusts that field either).
 */
export function getTailorableFieldText(fact: Pick<ResumeVersionSnapshotFact, "type" | "content">): string {
  const content = fact.content as Record<string, unknown>;
  switch (fact.type as TailorableFactType) {
    case "SUMMARY":
      return typeof content.text === "string" ? content.text : "";
    case "SKILL":
      return typeof content.name === "string" ? content.name : "";
    case "WORK_HISTORY":
    case "PROJECT":
      return Array.isArray(content.bullets) ? (content.bullets as string[]).join("\n") : "";
    default:
      return "";
  }
}

export function applyTailorableFieldText(
  content: Record<string, unknown>,
  type: TailorableFactType,
  text: string
): void {
  switch (type) {
    case "SUMMARY":
      content.text = text;
      break;
    case "SKILL":
      content.name = text;
      break;
    case "WORK_HISTORY":
    case "PROJECT":
      content.bullets = text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      break;
    default:
      break;
  }
}

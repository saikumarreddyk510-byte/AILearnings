import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";
import { applyTailorableFieldText } from "./field-mapping";
import type { EnforcedChange } from "./schemas";

export interface ReviewDecisionLike {
  decision: "ACCEPTED" | "REJECTED" | "EDITED";
  editedText: string | null;
}

/**
 * Deterministically assembles the final tailored résumé content from the
 * base snapshot + enforcement-annotated changes + review decisions. Never
 * AI-generated wholesale — this is what makes "AI may rewrite... but must
 * not invent qualifications" a structural guarantee rather than a prompt
 * instruction: the AI only ever proposes discrete, checkable rewrites, and
 * this function is the only thing that ever touches the document.
 *
 * `changePath` convention: String(change.index) into the *already
 * persisted, enforcement-annotated* recommendedChanges array — that array
 * is written once at generation time and never mutated, so index-based
 * paths are stable for the row's whole lifetime (mirrors the append-only
 * ReviewDecision contract in src/server/data/tailored-resumes.ts).
 *
 * A dropped change (`status !== "OK"`) is NEVER applied, even given a
 * forged ACCEPTED/EDITED decision for its changePath — belt-and-suspenders
 * against a compromised or buggy caller.
 */
export function assembleTailoredContent(
  baseFacts: ResumeVersionSnapshotFact[],
  enforcedChanges: EnforcedChange[],
  decisionsByChangePath: Map<string, ReviewDecisionLike>
): { facts: ResumeVersionSnapshotFact[] } {
  const facts = baseFacts.map((f) => ({ ...f, content: { ...(f.content as object) } }));
  const factsById = new Map(facts.map((f) => [f.id, f]));

  for (const change of enforcedChanges) {
    if (change.status !== "OK") continue;

    const decision = decisionsByChangePath.get(String(change.index));
    if (!decision || decision.decision === "REJECTED") continue;

    const finalText =
      decision.decision === "EDITED" ? (decision.editedText ?? "") : change.proposedText;
    if (!finalText) continue;

    const fact = factsById.get(change.targetFactId);
    if (!fact) continue; // defensive; can't happen when status === "OK"

    applyTailorableFieldText(fact.content as Record<string, unknown>, change.section, finalText);
  }

  return { facts };
}

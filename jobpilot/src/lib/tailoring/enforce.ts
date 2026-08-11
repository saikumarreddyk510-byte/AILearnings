import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";
import type { EnforcedChange, RecommendedChange } from "./schemas";

/**
 * Server-side, post-AI-call enforcement (spec: "locked résumé facts cannot
 * be changed by AI", "unsupported résumé claims are flagged instead of
 * inserted"). Runs exactly once, immediately after the AI call returns,
 * before anything is persisted — the AI is never trusted to have honored
 * the prompt's rules on its own. Pure, no I/O.
 *
 * Dropped entries are returned (never deleted) so the review UI can surface
 * them as "unsupported/uncertain statements" — but a `status !== "OK"`
 * entry must never be treated as applicable by assemble.ts, regardless of
 * what a ReviewDecision might later claim about it.
 */
export function enforceRecommendedChanges(
  changes: RecommendedChange[],
  snapshotFacts: ResumeVersionSnapshotFact[]
): EnforcedChange[] {
  const factsById = new Map(
    snapshotFacts.filter((f) => !!f.id).map((f) => [f.id as string, f])
  );

  return changes.map((change, index) => {
    const targetFact = factsById.get(change.targetFactId);
    const supportingFactsExist = change.supportingFactIds.every((id) => factsById.has(id));

    let status: EnforcedChange["status"];
    if (!targetFact) {
      status = "DROPPED_UNSUPPORTED_TARGET";
    } else if (!supportingFactsExist) {
      status = "DROPPED_UNSUPPORTED_SUPPORT";
    } else if (targetFact.locked) {
      status = "DROPPED_LOCKED_FACT";
    } else {
      status = "OK";
    }

    return {
      ...change,
      index,
      status,
      uncertain: change.confidence < 0.5,
    };
  });
}

import { createHash } from "node:crypto";

/**
 * Stable content fingerprint for deduplication (spec testing requirement:
 * "Duplicate jobs are detected"). Deterministic and dependency-free —
 * lowercases, trims, and collapses whitespace before hashing so trivial
 * formatting differences (extra spaces, casing) don't produce a false
 * "different job".
 */
export function computeContentFingerprint(input: {
  company: string;
  title: string;
  description: string;
}): string {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const combined = [
    normalize(input.company),
    normalize(input.title),
    normalize(input.description),
  ].join("|");
  return createHash("sha256").update(combined, "utf8").digest("hex");
}

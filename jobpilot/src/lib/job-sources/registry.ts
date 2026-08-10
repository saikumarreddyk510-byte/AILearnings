import type { JobSource } from "@/lib/job-sources/types";
import { MockJobSource } from "@/lib/job-sources/mock";

/**
 * Maps a JobSourceConnection.sourceType to its JobSource implementation.
 * Only "MOCK" is registered. Manual URL/paste and CSV import (Phase 3) are
 * deliberately NOT JobSource implementations — there's nothing to "search",
 * the user directly supplies the data — see src/lib/jobs/ instead. A real
 * permitted job-search API is still deferred; when added, it plugs in here
 * the same way MockJobSource does, with no other code changes.
 *
 * Per spec section C: never claim LinkedIn job-search/application support
 * unless approved credentials and documented permission exist — no such
 * adapter should ever be added here without that.
 */
const registry = new Map<string, JobSource>([["MOCK", new MockJobSource()]]);

export function getJobSource(sourceType: string): JobSource | null {
  return registry.get(sourceType) ?? null;
}

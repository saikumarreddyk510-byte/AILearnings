/**
 * In-memory, single-process, dependency-free fixed-window rate limiter
 * (spec SECURITY: "Add request validation and rate limiting"). No Redis —
 * documented known limitation: does not coordinate across multiple
 * instances/processes, acceptable for this MVP's single-instance
 * deployment story (same spirit as the spec's own "simple database-backed
 * queue for the MVP" concession elsewhere).
 *
 * `now` is an injectable clock, mirroring the injectable-`AIProvider`
 * pattern used in src/lib/matching/analyze.ts / src/lib/tailoring/tailor.ts
 * — window-reset tests never need real sleeps or fake timers.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface WindowState {
  count: number;
  windowStart: number;
}

const state = new Map<string, WindowState>();

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, now = Date.now() } = options;

  const existing = state.get(key);
  const windowExpired = !existing || now - existing.windowStart >= windowMs;

  if (windowExpired) {
    state.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count < limit) {
    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
  }

  return {
    allowed: false,
    remaining: 0,
    retryAfterMs: Math.max(0, windowMs - (now - existing.windowStart)),
  };
}

/** Test-only: clears all rate-limit state between tests. */
export function __resetRateLimitsForTests(): void {
  state.clear();
}

import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimitsForTests, checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimitsForTests();
  });

  it("allows calls under the limit", () => {
    const r1 = checkRateLimit("k1", { limit: 3, windowMs: 1000, now: 0 });
    const r2 = checkRateLimit("k1", { limit: 3, windowMs: 1000, now: 10 });
    const r3 = checkRateLimit("k1", { limit: 3, windowMs: 1000, now: 20 });
    expect(r1).toMatchObject({ allowed: true, remaining: 2 });
    expect(r2).toMatchObject({ allowed: true, remaining: 1 });
    expect(r3).toMatchObject({ allowed: true, remaining: 0 });
  });

  it("blocks the call once the limit is reached within the window", () => {
    checkRateLimit("k2", { limit: 2, windowMs: 1000, now: 0 });
    checkRateLimit("k2", { limit: 2, windowMs: 1000, now: 10 });
    const blocked = checkRateLimit("k2", { limit: 2, windowMs: 1000, now: 20 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    checkRateLimit("k3", { limit: 1, windowMs: 1000, now: 0 });
    const blocked = checkRateLimit("k3", { limit: 1, windowMs: 1000, now: 500 });
    expect(blocked.allowed).toBe(false);

    const afterWindow = checkRateLimit("k3", { limit: 1, windowMs: 1000, now: 1001 });
    expect(afterWindow.allowed).toBe(true);
  });

  it("isolates state per key", () => {
    checkRateLimit("k4a", { limit: 1, windowMs: 1000, now: 0 });
    const blockedA = checkRateLimit("k4a", { limit: 1, windowMs: 1000, now: 10 });
    const allowedB = checkRateLimit("k4b", { limit: 1, windowMs: 1000, now: 10 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("retryAfterMs shrinks toward 0 as time advances within the window", () => {
    checkRateLimit("k5", { limit: 1, windowMs: 1000, now: 0 });
    const early = checkRateLimit("k5", { limit: 1, windowMs: 1000, now: 100 });
    const late = checkRateLimit("k5", { limit: 1, windowMs: 1000, now: 900 });
    expect(early.retryAfterMs).toBeGreaterThan(late.retryAfterMs);
  });
});

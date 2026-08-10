import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Clamps a match score into the 0-100 range used throughout the app (spec
 * section E: "calculate a transparent score from 0-100"). Pure and trivial
 * on purpose — it's the Phase 1 smoke-test target proving `npm run test`
 * actually runs something meaningful.
 */
export function clampMatchScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)))
}

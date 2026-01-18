/**
 * IDEXX Neo DOM Selectors
 *
 * Aggregated selector exports for all IDEXX Neo pages.
 * Uses multi-fallback strategy for resilience against UI changes.
 *
 * Strategy Priority:
 * 1. data-testid attributes (most stable)
 * 2. Semantic class names
 * 3. Structural patterns
 * 4. Text content matching
 */

import type { SelectorSet } from "../types";

// Re-export all selector groups
export { LOGIN_SELECTORS } from "./login.selectors";
export { DASHBOARD_SELECTORS } from "./dashboard.selectors";
export { SCHEDULE_SELECTORS } from "./schedule.selectors";
export { CONSULTATION_SELECTORS } from "./consultation.selectors";
export { SESSION_SELECTORS } from "./session.selectors";

// Re-export individual selectors for direct access
export * from "./login.selectors";
export * from "./dashboard.selectors";
export * from "./schedule.selectors";
export * from "./consultation.selectors";
export * from "./session.selectors";

/**
 * Get all selector variants as an array (primary first, then fallbacks)
 */
export function getSelectorVariants(selectorSet: SelectorSet): string[] {
  return [
    selectorSet.primary,
    selectorSet.fallback1,
    selectorSet.fallback2,
    selectorSet.fallback3,
    selectorSet.fallback4,
  ].filter((s): s is string => !!s);
}

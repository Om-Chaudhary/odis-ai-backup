/**
 * @odis-ai/utils
 *
 * Pure utility functions for the ODIS platform.
 * No external dependencies beyond standard libraries.
 */

// Core utilities
export { cn } from "./cn";
export { formatDuration } from "./cn";

// Phone utilities (consolidated)
export * from "./phone";

// Contact utilities (email, etc.)
export * from "./contact";

// Date utilities
export * from "./business-hours";
export * from "./date-grouping";
export * from "./date-ranges";
export {
  DEFAULT_TIMEZONE,
  getLocalDayRange,
  formatLocalDate,
  formatLocalTime,
  formatLocalDateTime,
  toLocalDate,
  getTodayInTimezone,
  isOnDate,
  formatRelativeTime as formatTimezoneRelativeTime,
  getPresetDateRange,
  calculateScheduleTime,
} from "./timezone";

// Dashboard helpers
export * from "./dashboard-helpers";
export * from "./discharge-readiness";

// Error classes
export * from "./errors";

// Case transforms
export * from "./lib/case-transforms";

// Discharge status derivation
export * from "./lib/discharge-status";

// Relative time formatting
export {
  formatRelativeTime,
  formatDurationHuman,
  formatShortDateTime,
} from "./lib/relative-time";

// Attention summary parsing
export * from "./lib/attention-parser";

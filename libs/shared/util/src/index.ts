/**
 * @odis-ai/utils
 *
 * Pure utility functions for the ODIS platform.
 * No external dependencies beyond standard libraries.
 */

// Core utilities
export * from "./cn";

// Phone utilities
export * from "./phone";
export {
  formatPhoneNumberDisplay,
  formatPhoneCompact,
  formatPhoneShort,
  isValidE164,
  toE164,
  getCountryCode,
  isUSNumber,
  extractPhoneNumber,
  parsePhoneFromText,
  hasValidPhone,
  extractPhoneWithDetails,
  type PhoneExtractionResult,
} from "./phone-formatting";

// Contact utilities (email, etc.)
export * from "./contact";

// Date utilities
export * from "./business-hours";
export * from "./date-grouping";
export * from "./date-ranges";
export * from "./timezone";

// Dashboard helpers
export * from "./dashboard-helpers";
export * from "./discharge-readiness";

// Error classes
export * from "./errors";

// Case transforms
export * from "./lib/case-transforms";

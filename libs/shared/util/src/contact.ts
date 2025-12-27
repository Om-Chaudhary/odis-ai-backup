/**
 * Contact Information Utilities
 *
 * Functions for normalizing and validating contact information (email, etc.)
 */

/**
 * Normalizes an email address to lowercase and trims whitespace
 *
 * @param email - Email address in any format
 * @returns Normalized email address or null if invalid
 */
export function normalizeEmail(
  email: string | null | undefined,
): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Validate if an email address is in valid format
 *
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) !== null;
}

// Note: hasValidContact is in dashboard-helpers.ts for historical reasons
// Re-export it here for a logical grouping
export { hasValidContact } from "./dashboard-helpers";

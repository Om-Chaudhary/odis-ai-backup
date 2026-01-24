/**
 * Contact Information Utilities
 *
 * Functions for normalizing and validating contact information (email, phone, etc.)
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Check if an email address is in valid format
 *
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) !== null;
}

/**
 * List of placeholder values that indicate missing data
 */
const PLACEHOLDER_VALUES = [
  "Unknown Patient",
  "Unknown Species",
  "Unknown Breed",
  "Unknown Owner",
  "No email address",
  "No phone number",
] as const;

/**
 * Check if a value is a placeholder (missing data indicator)
 *
 * @param value - The value to check
 * @returns true if the value is a placeholder
 */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return false;
  return PLACEHOLDER_VALUES.includes(
    value as (typeof PLACEHOLDER_VALUES)[number],
  );
}

/**
 * Check if a contact value is valid (not a placeholder and not empty)
 *
 * @param value - The contact value to validate
 * @returns true if the value is valid and not a placeholder
 *
 * @example
 * hasValidContact(patient.owner_phone) // true if valid phone
 * hasValidContact("No phone number") // false (placeholder)
 * hasValidContact(null) // false
 */
export function hasValidContact(value: string | undefined | null): boolean {
  if (!value) return false;
  return !isPlaceholder(value) && value.trim().length > 0;
}

/**
 * Normalize a placeholder value to undefined
 *
 * Converts placeholder strings (like "Unknown Patient", "No phone number")
 * to undefined for cleaner data handling.
 *
 * @param value - The value to normalize
 * @returns undefined if value is a placeholder, otherwise the value
 */
export function normalizePlaceholder(
  value: string | undefined | null,
): string | undefined {
  if (!value) return undefined;
  return isPlaceholder(value) ? undefined : value;
}

/**
 * Get the effective contact value based on test mode
 *
 * When test mode is enabled and a valid test contact is provided,
 * returns the test contact. Otherwise, returns the patient contact.
 *
 * @param patientValue - The patient's actual contact value
 * @param testValue - The test contact value (used when test mode is enabled)
 * @param testModeEnabled - Whether test mode is currently enabled
 * @returns The effective contact value to use
 */
export function getEffectiveContact(
  patientValue: string | undefined | null,
  testValue: string | undefined | null,
  testModeEnabled: boolean,
): string | undefined | null {
  if (testModeEnabled && hasValidContact(testValue)) {
    return testValue ?? null;
  }
  return patientValue ?? null;
}

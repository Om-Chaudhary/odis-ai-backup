/**
 * Dashboard helper utilities
 *
 * Shared utility functions for dashboard components to avoid duplication.
 */

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
 *
 * @example
 * ```tsx
 * if (isPlaceholder(patient.name)) {
 *   // Handle missing patient name
 * }
 * ```
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
 * ```tsx
 * if (hasValidContact(patient.owner_phone)) {
 *   // Can proceed with call
 * }
 * ```
 */
export function hasValidContact(value: string | undefined | null): boolean {
  if (!value) return false;
  return !isPlaceholder(value) && value.trim().length > 0;
}

/**
 * Normalize a placeholder value to undefined
 *
 * Converts placeholder strings (like "Unknown Patient", "No phone number")
 * to undefined for cleaner data handling. Non-placeholder values are returned as-is.
 *
 * @param value - The value to normalize
 * @returns undefined if value is a placeholder, otherwise the value
 *
 * @example
 * ```tsx
 * const phone = normalizePlaceholder(patient.owner_phone) ?? "N/A";
 * ```
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
 *
 * @example
 * ```tsx
 * const effectivePhone = getEffectiveContact(
 *   patient.owner_phone,
 *   settings.testContactPhone,
 *   settings.testModeEnabled
 * );
 * ```
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

/**
 * VAPI Utility Functions
 *
 * Helper functions for working with VAPI dynamic variables and formatting.
 */

/**
 * Extracts the first word from a pet name
 *
 * Many veterinary systems store pet names as "FirstName LastName" (e.g., "Max Smith").
 * For VAPI calls, we only want to use the first name to sound more natural.
 *
 * @param name - The full pet name (may include first and last name)
 * @returns The first word only
 *
 * @example
 * extractFirstName('Max Smith') // 'Max'
 * extractFirstName('Buddy') // 'Buddy'
 * extractFirstName('Sir Barksalot III') // 'Sir'
 * extractFirstName('') // ''
 * extractFirstName(null) // ''
 */
export function extractFirstName(name: string | null | undefined): string {
  if (!name) return "";
  const trimmed = name.trim();
  const firstWord = trimmed.split(/\s+/)[0];
  return firstWord ?? trimmed;
}

/**
 * Converts a camelCase string to snake_case
 *
 * @param str - The camelCase string to convert
 * @returns The snake_case equivalent
 *
 * @example
 * camelToSnake('petName') // 'pet_name'
 * camelToSnake('clinicName') // 'clinic_name'
 * camelToSnake('appointmentDate') // 'appointment_date'
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts an object with camelCase keys to snake_case keys
 *
 * This is used to transform variables from the knowledge base system
 * (which uses camelCase) to the format expected by VAPI (which uses snake_case).
 *
 * @param obj - Object with camelCase keys
 * @returns New object with snake_case keys
 *
 * @example
 * convertKeysToSnakeCase({ petName: 'Max', ownerName: 'John' })
 * // { pet_name: 'Max', owner_name: 'John' }
 */
export function convertKeysToSnakeCase<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // Convert key to snake_case
    const snakeKey = camelToSnake(key);

    // Handle nested objects (for complex types like assessmentQuestions)
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      result[snakeKey] = convertKeysToSnakeCase(
        value as Record<string, unknown>,
      );
    }
    // Handle arrays of objects
    else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object"
    ) {
      result[snakeKey] = value.map((item) =>
        typeof item === "object" && item !== null && !(item instanceof Date)
          ? convertKeysToSnakeCase(item as Record<string, unknown>)
          : item,
      );
    }
    // Handle primitive values and arrays of primitives
    else {
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Normalizes variables to snake_case format for VAPI
 *
 * This function ensures all variable keys are in snake_case format,
 * which is what VAPI expects. It handles:
 * - camelCase keys from buildDynamicVariables
 * - snake_case keys from database
 * - Mixed formats
 *
 * @param variables - Variables in any format
 * @returns Variables normalized to snake_case
 */
export function normalizeVariablesToSnakeCase(
  variables: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!variables) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(variables)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }

    // If key is already snake_case, keep it as-is
    // If key is camelCase, convert it
    const normalizedKey = key.includes("_") ? key : camelToSnake(key);

    // Handle nested objects
    if (
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      result[normalizedKey] = convertKeysToSnakeCase(
        value as Record<string, unknown>,
      );
    }
    // Handle arrays of objects
    else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "object"
    ) {
      result[normalizedKey] = value.map((item) =>
        typeof item === "object" && item !== null && !(item instanceof Date)
          ? convertKeysToSnakeCase(item as Record<string, unknown>)
          : item,
      );
    }
    // Handle primitive values and arrays of primitives
    else {
      result[normalizedKey] = value;
    }
  }

  return result;
}

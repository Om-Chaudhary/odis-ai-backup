/**
 * Contact information normalization utilities
 * Handles phone numbers and email addresses
 */

/**
 * Normalize a phone number to E.164 format
 *
 * Handles common US phone formats:
 * - (415) 297-5859
 * - 415-297-5859
 * - 415.297.5859
 * - 4152975859
 * - +14152975859
 *
 * @param phone - Phone number in any common format
 * @param defaultCountryCode - Country code to prepend if missing (default: "1" for US)
 * @returns Phone number in E.164 format (+14152975859) or null if invalid
 */
export function normalizePhoneNumber(
  phone: string | null | undefined,
  defaultCountryCode: string = "1"
): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");

  if (!digitsOnly) return null;

  // If already has country code (11 digits for US: 1 + 10), use it
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  }

  // If 10 digits (US phone without country code), prepend default country code
  if (digitsOnly.length === 10) {
    return `+${defaultCountryCode}${digitsOnly}`;
  }

  // If already starts with + and looks valid, return as-is
  if (phone.startsWith("+") && digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }

  // For other lengths, prepend country code and hope for the best
  // This handles international numbers that might be missing the +
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    // If first digit is 1 and total is > 11, assume it's international without +
    if (digitsOnly.startsWith("1") && digitsOnly.length > 11) {
      return `+${digitsOnly}`;
    }
    // Otherwise, prepend default country code
    return `+${defaultCountryCode}${digitsOnly}`;
  }

  // Invalid length
  return null;
}

/**
 * Format a phone number for display (US format)
 *
 * @param phone - Phone number in any format
 * @returns Formatted phone number (e.g., "(415) 297-5859") or original if invalid
 */
export function formatPhoneNumberForDisplay(phone: string | null | undefined): string {
  if (!phone) return "";

  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return phone;

  // Remove + and country code for US numbers
  const digitsOnly = normalized.replace(/\D/g, "");

  // US format (11 digits: 1 + area code + number)
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    const withoutCountryCode = digitsOnly.substring(1);
    return `(${withoutCountryCode.substring(0, 3)}) ${withoutCountryCode.substring(3, 6)}-${withoutCountryCode.substring(6)}`;
  }

  // 10 digit format (no country code)
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6)}`;
  }

  // For non-US numbers, return normalized format
  return normalized;
}

/**
 * Normalize an email address
 *
 * - Trims whitespace
 * - Converts to lowercase
 * - Validates basic email format
 *
 * @param email - Email address in any format
 * @returns Normalized email or null if invalid
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  // Trim whitespace and convert to lowercase
  const normalized = email.trim().toLowerCase();

  // Basic email validation regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Validate if a string is a valid email address
 *
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) !== null;
}

/**
 * Phone Number Utilities
 *
 * Functions for formatting and validating phone numbers
 */

/**
 * Formats a phone number from E.164 format to readable format
 *
 * @param phone - Phone number in E.164 format (e.g., +14155551234) or null
 * @returns Formatted phone number or "N/A" if null
 *
 * @example
 * formatPhoneNumber("+14155551234") // Returns "+1 (415) 555-1234"
 * formatPhoneNumber(null) // Returns "N/A"
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return "N/A";

  // Format E.164 to readable format
  const cleaned = phone.replace(/^\+/, "");

  // US/Canada format: +1 (XXX) XXX-XXXX
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if not US/Canada format
  return phone;
}

/**
 * Normalizes a phone number to E.164 format
 * Removes all non-digit characters except leading +
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone number in E.164 format or null if invalid
 */
export function normalizePhoneNumber(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  const cleaned = phone.trim();
  if (!cleaned) return null;

  // If it starts with +, keep it, otherwise add +
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // If it doesn't start with +, add it
  if (!cleaned.startsWith("+")) {
    // If it's a US number (10 digits or 11 starting with 1), add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith("1")) {
      return `+${digits}`;
    }
    return `+${digits}`;
  }

  return cleaned.startsWith("+") ? cleaned : `+${digits}`;
}

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

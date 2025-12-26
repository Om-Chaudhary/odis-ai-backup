/**
 * Phone Number Utilities
 *
 * Functions for formatting and validating phone numbers
 */

/**
 * Formats a phone number to readable format
 * Handles various input formats including E.164, 10-digit, and formatted numbers
 *
 * @param phone - Phone number in any format (e.g., +14155551234, 4155551234, (415) 555-1234)
 * @returns Formatted phone number or "N/A" if null/invalid
 *
 * @example
 * formatPhoneNumber("+14155551234") // Returns "(415) 555-1234"
 * formatPhoneNumber("4155551234") // Returns "(415) 555-1234"
 * formatPhoneNumber("(415) 555-1234") // Returns "(415) 555-1234"
 * formatPhoneNumber(null) // Returns "N/A"
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return "N/A";

  // Extract only digits
  const digits = phone.replace(/\D/g, "");

  // Handle 10-digit US numbers (no country code)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Handle 11-digit US/Canada numbers (with country code)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if not US/Canada format
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
 * Normalizes a phone number to E.164 format, specifically ensuring
 * US numbers are always in +1XXXXXXXXXX format.
 *
 * This is the canonical function to use before saving phone numbers to the database.
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone number in E.164 format (+1XXXXXXXXXX for US) or null if invalid
 *
 * @example
 * normalizeToE164("(213) 777-4445") // Returns "+12137774445"
 * normalizeToE164("12137774445") // Returns "+12137774445"
 * normalizeToE164("+1 213-777-4445") // Returns "+12137774445"
 * normalizeToE164("2137774445") // Returns "+12137774445"
 */
export function normalizeToE164(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  const trimmed = phone.trim();
  if (!trimmed) return null;

  // Remove all non-digit characters
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Handle US numbers specifically
  // 10 digits without country code
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11 digits starting with 1 (US country code included)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // For other formats, check if original had + and preserve structure
  if (trimmed.startsWith("+")) {
    // Already has +, just clean and return
    return `+${digits}`;
  }

  // If we have digits but no clear format, assume it needs a +
  // Validate it's a reasonable E.164 length (1-15 digits after +)
  if (digits.length >= 1 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
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

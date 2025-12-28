/**
 * Phone Number Utilities
 *
 * Phone number normalization and formatting.
 */

/**
 * Normalize phone number to E.164 format
 *
 * @param phone - Raw phone number string
 * @returns Normalized phone in E.164 format or original if can't normalize
 */
export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;

  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // Assume US number if 10 digits
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already has country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Return original if we can't normalize
  return phone;
}

/**
 * Check if a string looks like a valid phone number
 */
export function isValidPhoneNumber(phone: string | null): boolean {
  if (!phone) return false;

  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

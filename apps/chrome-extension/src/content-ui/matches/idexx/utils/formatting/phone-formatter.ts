/**
 * Phone Number Formatting Utilities
 * Ensures all phone numbers are in E.164 format (+1XXXXXXXXXX) for VAPI
 */

/**
 * Normalize phone number to E.164 format (+1XXXXXXXXXX)
 * Handles various input formats:
 * - Raw 10-digit: "4088380314" → "+14088380314"
 * - With dashes: "408-838-0314" → "+14088380314"
 * - With spaces: "408 838 0314" → "+14088380314"
 * - With parentheses: "(408) 838-0314" → "+14088380314"
 * - With +1 already: "+1 408-838-0314" → "+14088380314"
 * - With country code: "1-408-838-0314" → "+14088380314"
 */
const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different digit lengths
  if (digits.length === 10) {
    // 10 digits: add +1 (US country code)
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // 11 digits starting with 1: already has country code
    return `+${digits}`;
  } else if (digits.length === 11) {
    // 11 digits not starting with 1: assume first digit is area code issue, take last 10
    return `+1${digits.slice(-10)}`;
  } else if (digits.length > 11) {
    // More than 11 digits: take last 10 and add +1
    return `+1${digits.slice(-10)}`;
  } else if (digits.length < 10) {
    // Less than 10 digits: can't normalize, return as-is with +1 prefix
    return `+1${digits}`;
  }

  // Fallback: add +1 prefix
  return `+1${digits}`;
};

/**
 * Validate if a phone number is in correct E.164 format
 * Must be exactly +1 followed by 10 digits
 */
const isValidE164PhoneNumber = (phone: string): boolean => {
  const e164Regex = /^\+1\d{10}$/;
  return e164Regex.test(phone);
};

/**
 * Format phone number for display (keeps E.164 format but adds visual spacing)
 * +14088380314 → +1 (408) 838-0314
 */
const formatPhoneForDisplay = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone);

  // Extract parts: +1 (XXX) XXX-XXXX
  const match = normalized.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
  }

  return normalized;
};

/**
 * Auto-format phone input as user types (for UI)
 * Formats to: +1 (XXX) XXX-XXXX while typing
 * But stores as: +1XXXXXXXXXX
 */
const formatPhoneInput = (input: string): string => {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // Limit to 11 digits (1 + 10)
  const limited = digits.slice(0, 11);

  // Format progressively as user types
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 1) {
    return `+${limited}`;
  } else if (limited.length <= 4) {
    // +1 (XXX
    return `+${limited[0]} (${limited.slice(1)}`;
  } else if (limited.length <= 7) {
    // +1 (XXX) XXX
    return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
  } else {
    // +1 (XXX) XXX-XXXX
    return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7, 11)}`;
  }
};

/**
 * Get raw E.164 format from display format
 * +1 (408) 838-0314 → +14088380314
 */
const getRawE164 = (formattedPhone: string): string => normalizePhoneNumber(formattedPhone);

// Exports
export { normalizePhoneNumber, isValidE164PhoneNumber, formatPhoneForDisplay, formatPhoneInput, getRawE164 };

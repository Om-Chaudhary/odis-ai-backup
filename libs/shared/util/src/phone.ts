/**
 * Phone Number Utilities
 *
 * Comprehensive functions for formatting, validating, and normalizing phone numbers.
 * Handles US and international formats, E.164 normalization, and messy real-world data.
 */

/**
 * Formats a phone number to readable format with fallback
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
  return formatPhoneNumberDisplay(phone);
}

/**
 * Format phone number for display
 * Supports US and international formats
 *
 * Examples:
 * +12137774445 => (213) 777-4445
 * +442071234567 => +44 20 7123 4567
 */
export function formatPhoneNumberDisplay(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Check if it's a US number (+1 followed by 10 digits)
  const usMatch = /^\+?1?(\d{3})(\d{3})(\d{4})$/.exec(cleaned);
  if (usMatch) {
    return `(${usMatch[1]}) ${usMatch[2]}-${usMatch[3]}`;
  }

  // For international numbers, just add spacing for readability
  if (cleaned.startsWith("+")) {
    const countryCode = cleaned.substring(0, 3);
    const rest = cleaned.substring(3);

    const chunks: string[] = [];
    let remaining = rest;
    while (remaining.length > 0) {
      if (remaining.length <= 4) {
        chunks.push(remaining);
        break;
      }
      chunks.push(remaining.substring(0, 3));
      remaining = remaining.substring(3);
    }

    return `${countryCode} ${chunks.join(" ")}`;
  }

  return cleaned;
}

/**
 * Format phone number for compact display (without formatting)
 * Useful for data attributes or compact views
 */
export function formatPhoneCompact(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Get a short display version of phone number (last 4 digits)
 * Useful for lists or compact views
 */
export function formatPhoneShort(phone: string): string {
  const cleaned = formatPhoneCompact(phone);
  const digits = cleaned.replace(/\+/g, "");

  if (digits.length >= 4) {
    return `•••• ${digits.slice(-4)}`;
  }

  return cleaned;
}

/**
 * Validate if a phone number is in E.164 format
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Convert phone number to E.164 format
 * Returns null if conversion fails
 *
 * This is the canonical function for converting to E.164.
 * Use normalizeToE164 for US-specific handling with +1 prefix.
 */
export function toE164(phone: string): string | null {
  let cleaned = phone.replace(/[^\d+]/g, "");

  if (!cleaned.startsWith("+")) {
    // Remove leading 1 if present (US country code)
    if (cleaned.startsWith("1") && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    // Add +1 for US
    if (cleaned.length === 10) {
      cleaned = `+1${cleaned}`;
    } else {
      return null;
    }
  }

  if (isValidE164(cleaned)) {
    return cleaned;
  }

  return null;
}

/**
 * Get country code from phone number
 */
export function getCountryCode(phone: string): string | null {
  const cleaned = formatPhoneCompact(phone);

  if (!cleaned.startsWith("+")) {
    return null;
  }

  const match = /^\+(\d{1,3})/.exec(cleaned);
  return match ? `+${match[1]}` : null;
}

/**
 * Check if phone number is US/Canada (+1)
 */
export function isUSNumber(phone: string): boolean {
  const countryCode = getCountryCode(phone);
  return countryCode === "+1";
}

/**
 * Normalizes a phone number to E.164 format (legacy compatibility)
 *
 * @deprecated Use normalizeToE164 for consistent behavior
 * @param phone - Phone number in any format
 * @returns Normalized phone number in E.164 format or null if invalid
 */
export function normalizePhoneNumber(
  phone: string | null | undefined,
): string | null {
  return normalizeToE164(phone);
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

// =============================================================================
// MESSY DATA HANDLING
// For real-world phone numbers from IDEXX/clinic systems that may contain
// extra text, notes, or formatting issues.
// =============================================================================

/**
 * Extract a phone number from messy text that may contain annotations.
 *
 * Real-world examples from IDEXX/clinic systems:
 * - "9258958479 BEST!"
 * - "NEW 925-346-1245"
 * - "Home: (925) 555-1234"
 * - "925.555.1234 cell"
 * - "CALL FIRST 925-555-1234"
 * - "925-555-1234 / 925-555-5678" (returns first match)
 *
 * @param text - Messy text that may contain a phone number
 * @returns Extracted phone number (digits only) or null if no valid number found
 */
export function extractPhoneNumber(text: string): string | null {
  if (!text || typeof text !== "string") {
    return null;
  }

  const phonePatterns = [
    /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
    /\b(\d{3})(\d{3})(\d{4})\b/,
  ];

  for (const pattern of phonePatterns) {
    const match = pattern.exec(text);
    if (match) {
      const areaCode = match[1];
      const exchange = match[2];
      const subscriber = match[3];

      if (areaCode && !areaCode.startsWith("0") && !areaCode.startsWith("1")) {
        return `${areaCode}${exchange}${subscriber}`;
      }
    }
  }

  return null;
}

/**
 * Extract and convert a phone number from messy text to E.164 format.
 *
 * This is the main function for processing discharge phone numbers.
 * It handles all the messy real-world data and returns a clean E.164 number.
 *
 * @param text - Messy text that may contain a phone number
 * @returns E.164 formatted phone number or null if no valid number found
 *
 * @example
 * parsePhoneFromText("9258958479 BEST!") // => "+19258958479"
 * parsePhoneFromText("NEW 925-346-1245") // => "+19253461245"
 * parsePhoneFromText("Call mom") // => null
 */
export function parsePhoneFromText(text: string): string | null {
  const extracted = extractPhoneNumber(text);
  if (!extracted) {
    return null;
  }
  return toE164(extracted);
}

/**
 * Check if text contains a valid extractable phone number.
 *
 * Useful for validation before attempting to schedule a discharge call.
 *
 * @param text - Text to check
 * @returns true if a valid phone number can be extracted
 */
export function hasValidPhone(text: string): boolean {
  return parsePhoneFromText(text) !== null;
}

/**
 * Result of phone extraction with details about what was found
 */
export interface PhoneExtractionResult {
  valid: boolean;
  e164: string | null;
  rawDigits: string | null;
  originalText: string;
  extraText: string | null;
}

/**
 * Extract phone number with detailed results.
 *
 * Useful for debugging or showing users what was extracted vs. discarded.
 *
 * @param text - Messy text that may contain a phone number
 * @returns Detailed extraction result
 */
export function extractPhoneWithDetails(text: string): PhoneExtractionResult {
  const originalText = text || "";
  const rawDigits = extractPhoneNumber(originalText);
  const e164 = rawDigits ? toE164(rawDigits) : null;

  let extraText: string | null = null;
  if (rawDigits && originalText) {
    const cleaned = originalText
      .replace(/[\d\s\-().+]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length > 0) {
      extraText = cleaned;
    }
  }

  return {
    valid: e164 !== null,
    e164,
    rawDigits,
    originalText,
    extraText,
  };
}

// Re-export normalizeEmail from contact.ts for backwards compatibility
// @deprecated Import from "@odis-ai/shared/util" instead
export { normalizeEmail } from "./contact";

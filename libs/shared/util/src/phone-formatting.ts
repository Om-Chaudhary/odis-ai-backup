/**
 * Phone number formatting utilities
 */

/**
 * Format phone number for display
 * Supports US and international formats
 *
 * Examples:
 * +12137774445 => (213) 777-4445
 * +442071234567 => +44 20 7123 4567
 */
export function formatPhoneNumberDisplay(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Check if it's a US number (+1 followed by 10 digits)
  const usMatch = /^\+?1?(\d{3})(\d{3})(\d{4})$/.exec(cleaned);
  if (usMatch) {
    return `(${usMatch[1]}) ${usMatch[2]}-${usMatch[3]}`;
  }

  // For international numbers, just add spacing for readability
  if (cleaned.startsWith("+")) {
    // Basic international formatting with spaces
    const countryCode = cleaned.substring(0, 3); // +XX
    const rest = cleaned.substring(3);

    // Group the rest in chunks of 3-4
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

  // If no formatting pattern matches, return as-is
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
  // E.164 format: +[1-9][0-9]{1,14}
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Convert phone number to E.164 format
 * Returns null if conversion fails
 */
export function toE164(phone: string): string | null {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If doesn't start with +, assume US number
  if (!cleaned.startsWith("+")) {
    // Remove leading 1 if present (US country code)
    if (cleaned.startsWith("1") && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }

    // Add +1 for US
    if (cleaned.length === 10) {
      cleaned = `+1${cleaned}`;
    } else {
      return null; // Invalid format
    }
  }

  // Validate E.164 format
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

  // Extract country code (1-3 digits after +)
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

  // Pattern to match US phone numbers in various formats:
  // - 10 consecutive digits: 9258958479
  // - With dashes: 925-895-8479
  // - With dots: 925.895.8479
  // - With parens: (925) 895-8479
  // - With spaces: 925 895 8479
  // - With country code: 1-925-895-8479 or +1 925-895-8479
  const phonePatterns = [
    // US format with optional country code, various separators
    /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
    // 10 consecutive digits
    /\b(\d{3})(\d{3})(\d{4})\b/,
  ];

  for (const pattern of phonePatterns) {
    const match = pattern.exec(text);
    if (match) {
      // Extract the three groups (area code, exchange, subscriber)
      const areaCode = match[1];
      const exchange = match[2];
      const subscriber = match[3];

      // Validate area code (first digit can't be 0 or 1 for US numbers)
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
  /** Whether a valid phone was found */
  valid: boolean;
  /** The extracted phone in E.164 format (if valid) */
  e164: string | null;
  /** The raw extracted digits (if any found) */
  rawDigits: string | null;
  /** The original input text */
  originalText: string;
  /** Any extra text that was removed (for logging/debugging) */
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

  // Figure out what extra text was removed
  let extraText: string | null = null;
  if (rawDigits && originalText) {
    // Remove all forms of the phone number from the text to see what's left
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

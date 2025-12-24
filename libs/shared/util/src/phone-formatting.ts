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
export function formatPhoneNumber(phone: string): string {
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

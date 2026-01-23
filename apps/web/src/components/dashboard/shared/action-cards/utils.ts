/**
 * Utility functions for action card data formatting
 */

/**
 * Format phone number for display
 * "(408) 661-4992" or "+1 (408) 661-4992"
 */
export function formatPhoneNumber(
  phone: string | null | undefined
): string | null {
  if (!phone) return null;

  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // Format based on length
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone; // Return as-is if unrecognized format
}

/**
 * Format patient name with species
 * "Daisy (Dog)" or "Daisy" if no species
 */
export function formatPatientDisplay(
  name: string | null | undefined,
  species: string | null | undefined
): string | null {
  if (!name) return null;

  if (species) {
    const capitalizedSpecies =
      species.charAt(0).toUpperCase() + species.slice(1);
    return `${name} (${capitalizedSpecies})`;
  }

  return name;
}

/**
 * Get urgency badge config
 */
export function getUrgencyConfig(level: "critical" | "urgent" | "monitor") {
  const configs = {
    critical: { emoji: "🔴", label: "CRITICAL", color: "text-red-600" },
    urgent: { emoji: "🟠", label: "URGENT", color: "text-orange-600" },
    monitor: { emoji: "🟡", label: "MONITOR", color: "text-yellow-600" },
  };

  return configs[level];
}

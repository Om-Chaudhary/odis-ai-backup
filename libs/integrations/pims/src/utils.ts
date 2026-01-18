/**
 * PIMS Utilities
 *
 * Common utilities for working with PIMS data.
 */

import type { PimsPhone, PimsClient, PimsPatient } from "./types";

/**
 * Get the primary phone number from a list of phones
 */
export function getPrimaryPhone(phones: PimsPhone[]): PimsPhone | undefined {
  // First, try to find explicitly marked primary
  const primary = phones.find((p) => p.isPrimary);
  if (primary) return primary;

  // Fall back to mobile > home > work > other
  const priorities: PimsPhone["type"][] = ["mobile", "home", "work", "other"];
  for (const type of priorities) {
    const phone = phones.find((p) => p.type === type);
    if (phone) return phone;
  }

  // Return first available
  return phones[0];
}

/**
 * Format a phone number for display
 */
export function formatPhoneDisplay(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // Format US phone numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Format with country code
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return original if format unknown
  return phone;
}

/**
 * Format a phone number for E.164 format (for VAPI)
 */
export function formatPhoneE164(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // Add country code if missing
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  // Return with + prefix if not present
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Format patient info for display
 */
export function formatPatientDisplay(patient: PimsPatient): string {
  const parts = [patient.name];

  if (patient.species) {
    parts.push(`(${patient.species}`);
    if (patient.breed) {
      parts.push(`- ${patient.breed})`);
    } else {
      parts.push(")");
    }
  }

  return parts.join(" ");
}

/**
 * Format client name for display
 */
export function formatClientDisplay(client: PimsClient): string {
  return client.fullName || `${client.firstName} ${client.lastName}`.trim();
}

/**
 * Check if a phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Extract phone numbers from HTML text (fallback for scraping)
 */
export function extractPhoneNumbers(text: string): string[] {
  // Common phone patterns
  const patterns = [
    /\+?1?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g,
    /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/g,
  ];

  const phones = new Set<string>();

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const digits = match[0].replace(/\D/g, "");
      if (digits.length >= 10) {
        phones.add(digits);
      }
    }
  }

  return Array.from(phones);
}

/**
 * Normalize species name for consistency
 */
export function normalizeSpecies(species: string): string {
  const normalized = species.toLowerCase().trim();

  const mappings: Record<string, string> = {
    canine: "Dog",
    dog: "Dog",
    feline: "Cat",
    cat: "Cat",
    rabbit: "Rabbit",
    bunny: "Rabbit",
    avian: "Bird",
    bird: "Bird",
    reptile: "Reptile",
    rodent: "Rodent",
    equine: "Horse",
    horse: "Horse",
  };

  return mappings[normalized] ?? species;
}

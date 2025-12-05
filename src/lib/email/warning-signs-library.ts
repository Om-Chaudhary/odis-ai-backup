/**
 * Curated Warning Signs Library
 *
 * Pre-written, veterinarian-approved warning signs by case type.
 * Used as fallback when no explicit warning signs are extracted from notes.
 *
 * SAFETY: These are general guidelines - specific warnings from clinical
 * notes should always take precedence when available.
 */

import type { DischargeCaseType } from "~/lib/validators/discharge-summary";

/**
 * Warning signs organized by case type
 * Each array contains 3 key warning signs that are:
 * - Safe to display for that case type
 * - Actionable for pet owners
 * - Not overly alarming but appropriately cautious
 */
export const warningSignsByCase: Record<DischargeCaseType, string[]> = {
  surgery: [
    "Excessive licking at incision site",
    "Bleeding or discharge from incision",
    "Vomiting or not eating for 24+ hours",
  ],

  dental: [
    "Bleeding from mouth that doesn't stop",
    "Refusal to eat or drink for 24+ hours",
    "Excessive drooling or pawing at mouth",
  ],

  vaccination: [
    "Facial swelling or hives",
    "Difficulty breathing",
    "Vomiting or severe lethargy lasting more than 24 hours",
  ],

  dermatology: [
    "Severe swelling or spreading redness",
    "Open sores or bleeding",
    "Difficulty breathing (possible allergic reaction)",
  ],

  wellness: [
    "Any concerning changes in behavior",
    "Loss of appetite lasting more than 24 hours",
    "Vomiting or diarrhea",
  ],

  emergency: [
    "Worsening of original symptoms",
    "New symptoms developing",
    "Any sudden changes in behavior or breathing",
  ],

  gastrointestinal: [
    "Blood in vomit or stool",
    "Continued vomiting for more than 24 hours",
    "Signs of abdominal pain (hunching, restlessness)",
  ],

  orthopedic: [
    "Increased limping or unwillingness to walk",
    "Swelling at the affected area",
    "Signs of severe pain (crying, aggression when touched)",
  ],

  other: [
    "Any concerning changes in behavior or appetite",
    "Worsening of symptoms",
    "New symptoms developing",
  ],
};

/**
 * Get warning signs for a case type
 * Returns curated warnings for the specified case type
 */
export function getWarningSignsForCase(caseType: DischargeCaseType): string[] {
  return warningSignsByCase[caseType] ?? warningSignsByCase.other;
}

/**
 * Get warning signs with hybrid approach:
 * - Use extracted warnings if available
 * - Fall back to curated warnings if none extracted
 *
 * @param extractedWarnings - Warnings extracted from clinical notes
 * @param caseType - The type of case for fallback selection
 * @returns Array of warning signs to display
 */
export function getWarningSignsHybrid(
  extractedWarnings: string[] | undefined,
  caseType: DischargeCaseType | undefined,
): string[] {
  // If we have extracted warnings, use those (they're from the actual notes)
  if (extractedWarnings && extractedWarnings.length > 0) {
    return extractedWarnings;
  }

  // Fall back to curated warnings based on case type
  const type = caseType ?? "other";
  return getWarningSignsForCase(type);
}

/**
 * Check if we should show warning signs section
 * Only show if we have either extracted or curated warnings
 */
export function shouldShowWarningSigns(
  extractedWarnings: string[] | undefined,
  caseType: DischargeCaseType | undefined,
): boolean {
  const warnings = getWarningSignsHybrid(extractedWarnings, caseType);
  return warnings.length > 0;
}

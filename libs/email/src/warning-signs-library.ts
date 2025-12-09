/**
 * Curated Warning Signs Library
 *
 * Pre-written, veterinarian-approved warning signs by case type.
 * Used as fallback when no explicit warning signs are extracted from notes.
 */

import type { DischargeCaseType } from "@odis/validators/discharge-summary";

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

export function getWarningSignsForCase(caseType: DischargeCaseType): string[] {
  return warningSignsByCase[caseType] ?? warningSignsByCase.other;
}

export function getWarningSignsHybrid(
  extractedWarnings: string[] | undefined,
  caseType: DischargeCaseType | undefined,
): string[] {
  if (extractedWarnings && extractedWarnings.length > 0) {
    return extractedWarnings;
  }
  const type = caseType ?? "other";
  return getWarningSignsForCase(type);
}

export function shouldShowWarningSigns(
  extractedWarnings: string[] | undefined,
  caseType: DischargeCaseType | undefined,
): boolean {
  const warnings = getWarningSignsHybrid(extractedWarnings, caseType);
  return warnings.length > 0;
}

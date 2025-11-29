import type { BackendCase } from "~/types/dashboard";
import { hasValidContact } from "./dashboard-helpers";

/**
 * Discharge requirements for a specific user
 */
export interface DischargeRequirements {
  /** Requires SOAP notes */
  requiresSoapNotes: boolean;
  /** Requires discharge summary */
  requiresDischargeSummary: boolean;
  /** Requires transcription */
  requiresTranscription: boolean;
  /** Requires case record (always true, but included for clarity) */
  requiresCase: boolean;
  /** Whether all requirements must be met (AND) or any requirement (OR) */
  requireAll: boolean;
}

/**
 * Result of checking case discharge readiness
 */
export interface DischargeReadinessResult {
  /** Whether the case meets all requirements */
  isReady: boolean;
  /** Missing requirements */
  missingRequirements: string[];
}

/**
 * Get discharge requirements for a specific user based on their email
 *
 * @param userEmail - User's email address
 * @returns Discharge requirements configuration
 */
export function getUserDischargeRequirements(
  userEmail: string | null | undefined,
): DischargeRequirements {
  if (!userEmail) {
    // Default: just needs any clinical notes
    return {
      requiresSoapNotes: false,
      requiresDischargeSummary: false,
      requiresTranscription: false,
      requiresCase: true,
      requireAll: false,
    };
  }

  const email = userEmail.toLowerCase();

  // jattvc@gmail.com: Requires SOAP notes, discharge summary, transcription, and case
  if (email === "jattvc@gmail.com") {
    return {
      requiresSoapNotes: true,
      requiresDischargeSummary: true,
      requiresTranscription: true,
      requiresCase: true,
      requireAll: true, // All must be present
    };
  }

  // garrybath@hotmail.com: Requires any clinical notes (SOAP, discharge summary, or transcription)
  if (email === "garrybath@hotmail.com") {
    return {
      requiresSoapNotes: false,
      requiresDischargeSummary: false,
      requiresTranscription: false,
      requiresCase: true,
      requireAll: false, // Any one is sufficient
    };
  }

  // Default: Same as garrybath (any clinical notes)
  return {
    requiresSoapNotes: false,
    requiresDischargeSummary: false,
    requiresTranscription: false,
    requiresCase: true,
    requireAll: false,
  };
}

/**
 * Check if a case meets discharge readiness requirements for a specific user
 *
 * A case is ready for discharge when BOTH conditions are met:
 * 1. Content Available: Clinical notes OR IDEXX metadata notes
 * 2. Contact Available: Valid phone OR valid email
 *
 * @param caseData - The case data to check
 * @param userEmail - User's email address (optional, for future user-specific requirements)
 * @returns Readiness result with status and missing requirements
 */
export function checkCaseDischargeReadiness(
  caseData: BackendCase,
  _userEmail: string | null | undefined,
): DischargeReadinessResult {
  const missingRequirements: string[] = [];

  // === CONDITION 1: Content Available ===
  let hasContent = false;

  if (caseData.source === "idexx_neo") {
    // IDEXX Neo cases: check metadata.idexx.notes
    const idexxNotes = caseData.metadata?.idexx?.notes;
    hasContent = Boolean(idexxNotes && idexxNotes.trim().length > 0);
    if (!hasContent) {
      missingRequirements.push("IDEXX appointment notes");
    }
  } else {
    // Manual/other cases: check clinical notes (SOAP, discharge summary, or transcription)
    const hasSoapNotes = (caseData.soap_notes?.length ?? 0) > 0 &&
      caseData.soap_notes?.some(
        (note) =>
          Boolean(note.subjective) ||
          Boolean(note.objective) ||
          Boolean(note.assessment) ||
          Boolean(note.plan),
      );

    const hasDischargeSummary =
      (caseData.discharge_summaries?.length ?? 0) > 0 &&
      caseData.discharge_summaries?.some(
        (summary) => summary.content && summary.content.trim().length > 0,
      );

    const hasTranscription = (caseData.transcriptions?.length ?? 0) > 0 &&
      caseData.transcriptions?.some(
        (transcription) =>
          transcription.transcript &&
          transcription.transcript.trim().length > 0,
      );

    hasContent = Boolean(hasSoapNotes) ||
      Boolean(hasDischargeSummary) ||
      Boolean(hasTranscription);

    if (!hasContent) {
      missingRequirements.push(
        "Clinical notes (SOAP, discharge summary, or transcription)",
      );
    }
  }

  // === CONDITION 2: Contact Available ===
  const patient = caseData.patients?.[0];
  const hasValidPhone = hasValidContact(patient?.owner_phone ?? null);
  const hasValidEmail = hasValidContact(patient?.owner_email ?? null);
  const hasContact = hasValidPhone || hasValidEmail;

  if (!hasContact) {
    missingRequirements.push("Contact info (phone or email)");
  }

  // Case is ready when BOTH content AND contact are available
  return {
    isReady: hasContent && hasContact,
    missingRequirements,
  };
}

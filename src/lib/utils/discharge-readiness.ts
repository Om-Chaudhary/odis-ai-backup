import type { BackendCase } from "~/types/dashboard";

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
 * @param caseData - The case data to check
 * @param userEmail - User's email address
 * @returns Readiness result with status and missing requirements
 */
export function checkCaseDischargeReadiness(
  caseData: BackendCase,
  userEmail: string | null | undefined,
): DischargeReadinessResult {
  const requirements = getUserDischargeRequirements(userEmail);
  const missingRequirements: string[] = [];

  // Check if case exists (always required)
  if (requirements.requiresCase && !caseData.id) {
    missingRequirements.push("Case record");
  }

  // Check SOAP notes
  const hasSoapNotes =
    (caseData.soap_notes?.length ?? 0) > 0 &&
    caseData.soap_notes?.some(
      (note) =>
        Boolean(note.subjective) ||
        Boolean(note.objective) ||
        Boolean(note.assessment) ||
        Boolean(note.plan),
    );

  if (requirements.requiresSoapNotes && !hasSoapNotes) {
    missingRequirements.push("SOAP notes");
  }

  // Check discharge summary
  const hasDischargeSummary =
    (caseData.discharge_summaries?.length ?? 0) > 0 &&
    caseData.discharge_summaries?.some(
      (summary) => summary.content && summary.content.trim().length > 0,
    );

  if (requirements.requiresDischargeSummary && !hasDischargeSummary) {
    missingRequirements.push("Discharge summary");
  }

  // Check transcription
  const hasTranscription =
    (caseData.transcriptions?.length ?? 0) > 0 &&
    caseData.transcriptions?.some(
      (transcription) =>
        transcription.transcript && transcription.transcript.trim().length > 0,
    );

  if (requirements.requiresTranscription && !hasTranscription) {
    missingRequirements.push("Transcription");
  }

  // Determine if ready based on requirements
  // Check if case has any clinical notes
  const hasAnyClinicalNotes =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    hasSoapNotes || hasDischargeSummary || hasTranscription;

  let isReady: boolean;

  if (requirements.requireAll) {
    // All requirements must be met (AND logic)
    isReady = missingRequirements.length === 0;
  } else {
    // For garrybath and default: need at least one clinical note type
    // If no specific requirements are set, just check for any clinical notes
    const hasSpecificRequirements =
      requirements.requiresSoapNotes ||
      requirements.requiresDischargeSummary ||
      requirements.requiresTranscription;

    if (hasSpecificRequirements) {
      // Some specific requirements exist, check those
      isReady = missingRequirements.length === 0;
    } else {
      // No specific requirements (like garrybath) - just need any clinical notes
      // Since missingRequirements will be empty (no requirements), just check for notes
      isReady = Boolean(hasAnyClinicalNotes);
    }
  }

  return {
    isReady,
    missingRequirements,
  };
}

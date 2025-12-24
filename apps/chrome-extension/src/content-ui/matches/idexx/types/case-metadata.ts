/**
 * Type definitions for case metadata from IDEXX
 *
 * These types provide type safety when accessing the JSONB metadata
 * stored in the cases table for IDEXX-sourced appointments.
 */

import type { Database } from "@odis-ai/shared/types";

type Case = Database["public"]["Tables"]["cases"]["Row"];

/**
 * IDEXX-specific metadata stored in case.metadata.idexx
 */
export interface IdexxCaseMetadata {
  // Appointment identifiers
  appointment_id?: string;
  consultation_id?: string | null;

  // Patient info
  patient_id?: string;
  patient_name?: string;
  patient_species?: string;
  patient_breed?: string;

  // Client info
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;

  // Provider info
  provider_id?: string;
  provider_name?: string;

  // Appointment details
  appointment_type?: string;
  appointment_duration?: number;
  appointment_status?: string;
  appointment_reason?: string;
  notes?: string;

  // Extraction metadata
  extracted_at?: string;
  extracted_from?: string;

  // Consultation notes (populated by reconciliation)
  consultation_notes?: string | null;
  consultation_status?: string;
  notes_synced_at?: string | null;
}

/**
 * Root metadata structure for cases
 */
export interface CaseMetadata {
  idexx?: IdexxCaseMetadata;
  [key: string]: unknown;
}

/**
 * Type guard to check if metadata has IDEXX data
 */
export const hasIdexxMetadata = (
  metadata: unknown,
): metadata is CaseMetadata => {
  if (!metadata || typeof metadata !== "object") return false;
  return "idexx" in metadata;
};

/**
 * Safely extract IDEXX metadata from a case
 *
 * @param caseItem - The case to extract metadata from
 * @returns IDEXX metadata or null if not present
 *
 * @example
 * ```ts
 * const idexx = getIdexxMetadata(caseItem);
 * if (idexx) {
 *   console.log(idexx.patient_name);
 * }
 * ```
 */
export const getIdexxMetadata = (caseItem: Case): IdexxCaseMetadata | null => {
  const metadata = caseItem.metadata as CaseMetadata | null;
  return metadata?.idexx ?? null;
};

/**
 * Get patient name from case metadata with fallback
 */
export const getPatientName = (
  caseItem: Case,
  fallback = "Unknown",
): string => {
  const idexx = getIdexxMetadata(caseItem);
  return idexx?.patient_name || fallback;
};

/**
 * Check if case has consultation notes
 */
export const hasConsultationNotes = (caseItem: Case): boolean => {
  const idexx = getIdexxMetadata(caseItem);
  return Boolean(idexx?.consultation_notes);
};

/**
 * Check if case needs notes reconciliation
 */
export const needsNotesReconciliation = (caseItem: Case): boolean => {
  const idexx = getIdexxMetadata(caseItem);
  if (!idexx) return false;

  // Has appointment but no consultation notes yet
  return Boolean(idexx.appointment_id) && !idexx.consultation_notes;
};

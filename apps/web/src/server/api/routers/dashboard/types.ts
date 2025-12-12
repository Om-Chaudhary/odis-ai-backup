/**
 * Dashboard Router Types
 *
 * Shared type definitions used across dashboard router modules.
 */

// Type helpers for Supabase responses
export type SupabasePatient = {
  id: string;
  name: string;
  species?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
};

export type SupabasePatientsResponse = SupabasePatient[];

export type DynamicVariables = {
  pet_name?: string;
  owner_name?: string;
  [key: string]: unknown;
};

export type CallAnalysis = {
  successEvaluation?: string | boolean;
  [key: string]: unknown;
};

// Type definition for case with relations
export type CaseWithRelations = {
  id: string;
  status: string | null;
  source: string | null;
  created_at: string | null;
  discharge_summaries: Array<{ id: string }> | null;
  soap_notes: Array<{ id: string }> | null;
};

export type CaseWithPatients = {
  id: string;
  status: string | null;
  source: string | null;
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null;
  created_at: string | null;
  scheduled_at: string | null;
  is_starred: boolean | null;
  patients: SupabasePatientsResponse;
};

// Helper functions
export const hasDischargeSummary = (caseData: CaseWithRelations): boolean => {
  return (
    Array.isArray(caseData.discharge_summaries) &&
    caseData.discharge_summaries.length > 0
  );
};

export const hasSoapNote = (caseData: CaseWithRelations): boolean => {
  return Array.isArray(caseData.soap_notes) && caseData.soap_notes.length > 0;
};

export const calculatePercentage = (part: number, total: number): number => {
  return total > 0 ? Math.round((part / total) * 100) : 0;
};

export const normalizeString = (
  value: string | null | undefined,
): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (
    trimmed === "" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed.toLowerCase() === "null null" ||
    trimmed.toLowerCase().startsWith("null ")
  ) {
    return null;
  }
  return trimmed;
};

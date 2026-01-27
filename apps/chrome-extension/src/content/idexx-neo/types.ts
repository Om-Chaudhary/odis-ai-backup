/**
 * Types specific to IDEXX Neo content script
 */

// Re-export shared type for convenience
export type { IdexxPatientData } from "@odis-ai/extension/shared";

/**
 * IDEXX Neo page types
 */
export type IdexxPageType =
  | "patientDetail"
  | "dischargeSummary"
  | "appointmentList"
  | "unknown";

/**
 * IDEXX Neo client data extracted from page
 */
export interface IdexxClientData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * IDEXX Neo visit/appointment data
 */
export interface IdexxVisitData {
  visitId?: string;
  date?: string;
  reason?: string;
  status?: string;
  veterinarian?: string;
}

/**
 * Complete extracted data from IDEXX Neo page
 */
export interface IdexxExtractedData {
  pageType: IdexxPageType;
  patient?: {
    id?: string;
    name?: string;
    species?: string;
    breed?: string;
  };
  client?: IdexxClientData;
  visit?: IdexxVisitData;
  extractedAt: string;
}

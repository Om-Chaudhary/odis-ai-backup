/**
 * ODIS API Types
 *
 * Types for the ODIS /api/cases/ingest endpoint.
 * Used for syncing IDEXX appointments to the ODIS backend.
 */

/**
 * IDEXX appointment data sent to ODIS API
 * Matches IdexxAppointmentDataSchema in @odis-ai/validators
 */
export interface IdexxAppointmentData {
  // Identifiers
  appointmentId?: string;
  consultationId?: string;

  // Patient info
  pet_name: string;
  species?: string;
  breed?: string;
  age?: string;
  sex?: string;
  weight?: string;

  // Owner info
  owner_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  phone_number?: string;
  mobile_number?: string;
  email?: string;

  // Clinical data
  consultation_notes?: string;
  products_services?: string;
  declined_products_services?: string;

  // Appointment details
  appointment_type?: string;
  appointment_date?: string;
  appointment_time?: string;
  provider_name?: string;
  provider_id?: string;

  // Additional metadata (passed through)
  appointment_status?: string;
  appointment_duration?: number;
  appointment_reason?: string;
  notes?: string;
}

/**
 * Request body for /api/cases/ingest
 */
export interface IdexxIngestRequest {
  appointment: IdexxAppointmentData;
  syncDate?: string;
  options?: {
    autoSchedule?: boolean;
    skipGeneration?: boolean;
    forceRegenerate?: boolean;
  };
}

/**
 * Generation status for each step
 */
export type GenerationStatus = "completed" | "skipped" | "failed";

/**
 * Response from /api/cases/ingest
 */
export interface IdexxIngestResponse {
  success: boolean;
  data?: {
    caseId: string;
    patientName: string;
    ownerName?: string;
    ownerPhone?: string;
    ownerEmail?: string;
    generation: {
      entityExtraction: GenerationStatus;
      dischargeSummary: GenerationStatus;
      callIntelligence: GenerationStatus;
    };
    scheduledCall?: {
      id: string;
      scheduledFor: string;
    } | null;
    timing: {
      totalMs: number;
      entityExtractionMs?: number;
      dischargeSummaryMs?: number;
      callIntelligenceMs?: number;
    };
  };
  error?: string;
}

/**
 * Response from DELETE /api/cases/ingest?appointmentId=xxx
 */
export interface IdexxDeleteResponse {
  success: boolean;
  deleted: boolean;
  appointmentId: string;
  error?: string;
}

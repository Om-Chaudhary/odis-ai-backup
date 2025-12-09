/**
 * Service Type Definitions
 *
 * Types used across service layer for case ingestion, scheduling, and management.
 */

import type { NormalizedEntities } from "@odis-ai/validators/scribe";

/* ========================================
   Case Ingestion Types
   ======================================== */

/**
 * Mode of data ingestion
 */
export type IngestMode = "text" | "structured";

/**
 * Source of ingested data
 */
export type IngestSource =
  | "manual"
  | "mobile_app"
  | "web_dashboard"
  | "idexx_neo"
  | "idexx_extension"
  | "ezyvet_api";

/**
 * Payload for ingesting case data
 */
export type IngestPayload =
  | {
      mode: "text";
      source: IngestSource;
      text: string;
      options?: {
        autoSchedule?: boolean;
        inputType?: string; // e.g. "soap_note", "transcript"
      };
    }
  | {
      mode: "structured";
      source: IngestSource;
      data: Record<string, unknown>; // Raw JSON from IDEXX/Extension
      options?: {
        autoSchedule?: boolean;
      };
    };

/**
 * Options for scheduling a discharge call
 */
export interface CaseScheduleOptions {
  scheduledAt?: Date;
  assistantId?: string;
  phoneNumberId?: string;
  notes?: string;
  clinicName?: string;
  clinicPhone?: string;
  emergencyPhone?: string;
  agentName?: string;
  summaryContent?: string;
}

/**
 * Result of case ingestion
 */
export interface IngestResult {
  caseId: string;
  entities: NormalizedEntities;
  scheduledCall: ScheduledDischargeCall | null;
}

/* ========================================
   Scheduled Call Types
   ======================================== */

/**
 * Metadata structure for scheduled calls
 */
export interface ScheduledCallMetadata {
  notes?: string;
  retry_count?: number;
  max_retries?: number;
  qstash_message_id?: string;
  [key: string]: unknown;
}

/**
 * Scheduled discharge call structure
 * Extends the base ScheduledCall with case_id
 */
export interface ScheduledDischargeCall {
  id: string;
  user_id: string;
  case_id: string | null;
  assistant_id: string;
  phone_number_id: string;
  customer_phone: string;
  scheduled_for: string;
  status: "queued" | "in-progress" | "completed" | "failed" | "canceled";
  vapi_call_id?: string | null;
  dynamic_variables: Record<string, unknown>;
  metadata: ScheduledCallMetadata;
  created_at: string;
  updated_at: string;
}

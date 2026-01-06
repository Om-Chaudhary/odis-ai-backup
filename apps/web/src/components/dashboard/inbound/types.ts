/**
 * Types for Inbound Dashboard
 *
 * Handles two data sources:
 * - inbound_vapi_calls (inbound calls data)
 * - vapi_bookings (appointment requests from VAPI schedule-appointment tool)
 */

// =============================================================================
// Status Enums
// =============================================================================

/**
 * Appointment request status
 */
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled";

/**
 * Call status (from inbound_vapi_calls)
 */
export type CallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * User sentiment from call analysis
 */
export type UserSentiment = "positive" | "neutral" | "negative";

// =============================================================================
// Data Types
// =============================================================================

/**
 * Appointment request from VAPI schedule-appointment tool
 */
export interface AppointmentRequest {
  id: string;
  clinicId: string;
  providerId: string | null;
  clientName: string;
  clientPhone: string;
  patientName: string;
  species: string | null;
  breed: string | null;
  reason: string | null;
  requestedDate: string | null;
  requestedStartTime: string | null;
  requestedEndTime: string | null;
  status: AppointmentStatus;
  isNewClient: boolean | null;
  isOutlier: boolean | null;
  notes: string | null;
  vapiCallId: string | null;
  confirmedAppointmentId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Call Intelligence Types (Descriptive for Clinical Staff)
// =============================================================================
// Using index signatures for compatibility with CallIntelligenceSection component

/**
 * Call outcome structured data - describes how the call went
 */
export interface CallOutcomeData {
  [key: string]: unknown;
  call_outcome?: string;
  outcome_summary?: string;
  conversation_stage_reached?: string;
  key_topics_discussed?: string[];
}

/**
 * Pet health status - describes pet's current condition
 */
export interface PetHealthData {
  [key: string]: unknown;
  pet_recovery_status?: string;
  health_summary?: string;
  symptoms_reported?: string[];
  owner_observations?: string;
}

/**
 * Medication compliance - describes medication adherence
 */
export interface MedicationComplianceData {
  [key: string]: unknown;
  medication_compliance?: string;
  compliance_summary?: string;
  medications_mentioned?: string[];
  medication_concerns?: string;
}

/**
 * Owner sentiment - describes owner's emotional state
 */
export interface OwnerSentimentData {
  [key: string]: unknown;
  owner_sentiment?: string;
  sentiment_summary?: string;
  notable_comments?: string;
}

/**
 * Escalation tracking - describes any escalations needed
 */
export interface EscalationData {
  [key: string]: unknown;
  escalation_triggered?: boolean;
  escalation_summary?: string;
  escalation_type?: string;
  staff_action_needed?: string;
}

/**
 * Follow-up status - describes follow-up needs
 */
export interface FollowUpData {
  [key: string]: unknown;
  follow_up_needed?: boolean;
  follow_up_summary?: string;
  appointment_status?: string;
  next_steps?: string;
}

/**
 * Call outcome category for badge display
 * Maps to VAPI outcome values from get-descriptive-outcome.ts:
 * - scheduled, rescheduled, cancellation -> Appointment
 * - emergency -> Emergency
 * - callback -> Callback
 * - info -> Info
 */
export type CallOutcome =
  | "scheduled"
  | "rescheduled"
  | "cancellation"
  | "emergency"
  | "callback"
  | "info"
  | null;

/**
 * Inbound call from inbound_vapi_calls table
 * Uses snake_case to match database schema
 */
export interface InboundCall {
  id: string;
  vapi_call_id: string;
  clinic_name: string | null;
  customer_phone: string | null;
  status: CallStatus;
  user_sentiment: UserSentiment | null;
  duration_seconds: number | null;
  cost: number | null;
  transcript: string | null;
  /** AI-cleaned version of the transcript with typos and transcription errors fixed */
  cleaned_transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  ended_reason: string | null;
  created_at: string;
  updated_at: string;
  // Call outcome classification
  /** Call outcome category for badge display */
  outcome?: CallOutcome | null;
  /** Array of action items extracted from the call */
  actions_taken?: string[] | null;
  // Call intelligence columns
  attention_types?: string[] | null;
  attention_severity?: string | null;
  attention_summary?: string | null;
  attention_flagged_at?: string | null;
  call_outcome_data?: CallOutcomeData | null;
  pet_health_data?: PetHealthData | null;
  medication_compliance_data?: MedicationComplianceData | null;
  owner_sentiment_data?: OwnerSentimentData | null;
  escalation_data?: EscalationData | null;
  follow_up_data?: FollowUpData | null;
}

// =============================================================================
// View & Filter Types
// =============================================================================

/**
 * Outcome filter category for the unified calls table
 * Maps to display categories in the filter dropdown
 */
export type OutcomeFilterCategory =
  | "emergency" // Emergency triage calls
  | "appointment" // All appointment-related calls (scheduled, rescheduled, cancellation)
  | "callback" // Callback request calls
  | "info"; // Informational calls

/**
 * Outcome filter type
 * Can be "all" or an array of specific outcome categories
 */
export type OutcomeFilter = "all" | OutcomeFilterCategory[];

/**
 * Action filter for calls
 * - needs_attention: Priority, callbacks, records, Rx, appointment requests, follow-ups
 * - all: All calls
 * - urgent_only: Only urgent/priority calls
 * - info_only: Informational calls (already handled)
 */
export type CallActionFilter =
  | "needs_attention"
  | "all"
  | "urgent_only"
  | "info_only";

/**
 * Status filter for calls (by call status)
 */
export type CallStatusFilter =
  | "all"
  | "completed"
  | "in_progress"
  | "failed"
  | "cancelled";

// =============================================================================
// Stats Types
// =============================================================================

/**
 * Statistics for appointments
 */
export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  rejected: number;
  cancelled: number;
}

/**
 * Statistics for calls
 */
export interface CallStats {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  cancelled: number;
  needsAttention: number; // Calls requiring staff action
}

/**
 * Combined inbound stats
 */
export interface InboundStats {
  appointments: AppointmentStats;
  calls: CallStats;
  totals: {
    appointments: number;
    calls: number;
    needsAttention: number;
  };
}

// =============================================================================
// Pagination
// =============================================================================

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

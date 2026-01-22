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
 * Booking data from vapi_bookings table
 * Used for structured display in action cards
 */
export interface BookingData {
  /** Patient/pet name */
  patient_name: string;
  /** Species (e.g., "cat", "dog") */
  species: string | null;
  /** Breed (e.g., "British Longhair") */
  breed: string | null;
  /** Appointment date (YYYY-MM-DD) */
  date: string;
  /** Start time (HH:MM:SS) */
  start_time: string;
  /** Reason for visit */
  reason: string | null;
  /** Client/owner name */
  client_name: string;
  /** Client phone number */
  client_phone: string;
  /** Booking status: "confirmed" | "cancelled" | "pending" | etc. */
  status: string;
  /** Whether this is a new client */
  is_new_client: boolean | null;
  /** Rescheduled reason if applicable */
  rescheduled_reason: string | null;
  /** Original appointment date before rescheduling (YYYY-MM-DD) */
  original_date: string | null;
  /** Original start time before rescheduling (HH:MM:SS) */
  original_time: string | null;
}

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
  /** Pre-computed action card data from VAPI structured output (new calls) */
  action_card_data?: ActionCardData | null;
}

// =============================================================================
// Action Card Data (from VAPI structured output)
// =============================================================================

/**
 * Action card data from VAPI structured output
 * Pre-formatted data for action card display in dashboard
 */
export interface ActionCardData {
  /** Type of action card to display */
  card_type:
    | "scheduled"
    | "rescheduled"
    | "cancellation"
    | "emergency"
    | "callback"
    | "info";

  /** Appointment data for scheduled/rescheduled/cancellation cards */
  appointment_data?: {
    patient_name?: string;
    client_name?: string;
    date?: string;
    time?: string;
    reason?: string;
  };

  /** Original appointment data for rescheduled cards */
  original_appointment?: {
    date?: string;
    time?: string;
  };

  /** Reason for rescheduling */
  reschedule_reason?: string;

  /** Reason for cancellation */
  cancellation_reason?: string;

  /** Emergency triage data */
  emergency_data?: {
    symptoms?: string[];
    er_name?: string | null;
    urgency_level?: "critical" | "urgent" | "monitor";
  };

  /** Callback request data */
  callback_data?: {
    reason?: string;
    phone_number?: string;
    caller_name?: string;
    pet_name?: string;
  };

  /** Informational call data */
  info_data?: {
    topics?: string[];
    summary?: string;
  };
}

// =============================================================================
// View & Filter Types
// =============================================================================

/**
 * Outcome filter value for the inbound table
 * Maps to specific call outcomes
 */
export type OutcomeFilterValue =
  | "appointment" // Combines scheduled, rescheduled, cancellation
  | "emergency"
  | "callback"
  | "info";

/**
 * Outcome filter type
 * Can be "all" or a specific outcome value (single-select)
 */
export type OutcomeFilter = "all" | OutcomeFilterValue;

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
  // Granular outcome counts
  scheduled: number;
  rescheduled: number;
  cancellation: number;
  emergency: number;
  callback: number;
  info: number;
  // Legacy grouped counts (computed from granular counts)
  appointment: number; // scheduled + rescheduled + cancellation
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

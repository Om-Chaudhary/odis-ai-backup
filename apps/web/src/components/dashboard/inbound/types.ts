/**
 * Types for Inbound Dashboard
 *
 * Handles three data sources:
 * - inbound_vapi_calls (existing calls data)
 * - appointment_requests (from VAPI schedule-appointment tool)
 * - clinic_messages (from VAPI leave-message tool)
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
 * Clinic message status
 */
export type MessageStatus = "new" | "read" | "resolved";

/**
 * Message priority
 */
export type MessagePriority = "urgent" | "normal";

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

/**
 * Clinic message from VAPI leave-message tool
 */
export interface ClinicMessage {
  id: string;
  clinicId: string;
  callerName: string | null;
  callerPhone: string;
  messageContent: string;
  messageType: string;
  priority: MessagePriority | null;
  status: MessageStatus;
  assignedToUserId: string | null;
  vapiCallId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
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
 */
export type CallOutcome =
  | "Scheduled"
  | "Cancellation"
  | "Info"
  | "Emergency"
  | "Call Back"
  | "Completed";

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
 * View mode tabs for the inbound dashboard
 */
export type ViewMode = "calls" | "appointments" | "messages";

/**
 * Status filter for calls tab
 */
export type CallStatusFilter =
  | "all"
  | "completed"
  | "in_progress"
  | "failed"
  | "cancelled";

/**
 * Status filter for appointments tab
 */
export type AppointmentStatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "rejected";

/**
 * Status filter for messages tab
 */
export type MessageStatusFilter =
  | "all"
  | "new"
  | "read"
  | "resolved"
  | "urgent";

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
 * Statistics for messages
 */
export interface MessageStats {
  total: number;
  new: number;
  read: number;
  resolved: number;
  urgent: number;
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
}

/**
 * Combined inbound stats
 */
export interface InboundStats {
  appointments: AppointmentStats;
  messages: MessageStats;
  calls: CallStats;
  totals: {
    appointments: number;
    messages: number;
    calls: number;
    needsAttention: number;
  };
}

// =============================================================================
// Table Item Union Type
// =============================================================================

/**
 * Union type for table items (used in generic table component)
 */
export type InboundItem = AppointmentRequest | ClinicMessage | InboundCall;

/**
 * Type guard for AppointmentRequest
 */
export function isAppointmentRequest(
  item: InboundItem,
): item is AppointmentRequest {
  return "patientName" in item && "species" in item;
}

/**
 * Type guard for ClinicMessage
 */
export function isClinicMessage(item: InboundItem): item is ClinicMessage {
  return "messageContent" in item && "callerName" in item;
}

/**
 * Type guard for InboundCall
 */
export function isInboundCall(item: InboundItem): item is InboundCall {
  return "vapi_call_id" in item && "customer_phone" in item;
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

// =============================================================================
// Summary Stats for Tabs
// =============================================================================

/**
 * Summary stats displayed in filter tabs
 */
export interface InboundSummaryStats {
  calls: number;
  appointments: number;
  messages: number;
  // Sub-counts for badges
  pendingAppointments: number;
  newMessages: number;
  urgentMessages: number;
}

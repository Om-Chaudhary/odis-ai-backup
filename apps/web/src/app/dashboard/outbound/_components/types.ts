/**
 * Types for Outbound Discharge Call Manager
 *
 * Based on Supabase schema:
 * - cases (case records with patients, status)
 * - patients (pet info, owner contact)
 * - discharge_summaries (AI-generated content)
 * - scheduled_discharge_calls (outbound calls via VAPI)
 * - scheduled_discharge_emails (outbound emails via Resend)
 * - discharge_batches / discharge_batch_items (batch operations)
 */

// =============================================================================
// Call/Email Status (from scheduled_discharge_calls & scheduled_discharge_emails)
// =============================================================================

/**
 * Status for scheduled discharge calls
 * Maps to: scheduled_discharge_calls.status CHECK constraint
 */
export type CallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Status for scheduled discharge emails
 * Maps to: scheduled_discharge_emails.status CHECK constraint
 */
export type EmailStatus = "queued" | "sent" | "failed" | "cancelled";

/**
 * Review category for admin triage
 * Maps to: scheduled_discharge_calls.review_category CHECK constraint
 */
export type ReviewCategory =
  | "to_review"
  | "good"
  | "bad"
  | "voicemail"
  | "failed"
  | "no_answer"
  | "needs_followup";

/**
 * Case status from cases table
 * Maps to: cases.status enum (CaseStatus)
 */
export type CaseStatus = "reviewed" | "ongoing" | "completed" | "draft";

/**
 * Case type from cases table
 * Maps to: cases.type enum (CaseType)
 */
export type CaseType = "checkup" | "emergency" | "surgery" | "follow_up";

// =============================================================================
// Composite Discharge Status (for UI display)
// =============================================================================

/**
 * Unified status for the discharge queue UI
 * Derived from case + call + email statuses
 */
export type DischargeCaseStatus =
  | "pending_review" // Case completed, discharge summary exists, not yet scheduled
  | "scheduled" // Approved, waiting for scheduled time (future scheduled_for)
  | "ready" // Approved, call/email queued and ready to send (scheduled_for <= now)
  | "in_progress" // Call ringing or in progress
  | "completed" // Both call and email sent successfully
  | "failed"; // Call or email failed

/**
 * Delivery status indicator for phone/email columns
 */
export type DeliveryStatus =
  | "sent" // Successfully delivered
  | "pending" // Queued, waiting
  | "failed" // Failed to deliver
  | "not_applicable" // No contact info
  | null; // Not scheduled

// =============================================================================
// Patient & Owner (from patients table)
// =============================================================================

/**
 * Patient information
 * Maps to: patients table columns
 */
export interface Patient {
  id: string;
  name: string;
  species: string | null; // e.g., "Canine", "Feline", "Avian"
  breed: string | null;
  dateOfBirth: Date | null;
  sex: string | null; // e.g., "Male Neutered", "Female Spayed"
  weightKg: number | null;
}

/**
 * Owner/client information
 * Maps to: patients table owner_* columns
 */
export interface Owner {
  name: string | null;
  phone: string | null; // E.164 format
  email: string | null;
}

// =============================================================================
// Discharge Content (from discharge_summaries)
// =============================================================================

/**
 * Structured discharge content sections
 * Maps to: discharge_summaries.structured_content JSONB
 * Mirrors StructuredDischargeSummary from validators for compatibility
 */
export interface StructuredDischargeContent {
  patientName?: string;
  caseType?: string;
  appointmentSummary?: string;
  visitSummary?: string;
  diagnosis?: string;
  treatmentsToday?: string[];
  vaccinationsGiven?: string[];
  medications?: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    totalQuantity?: string;
    purpose?: string;
    instructions?: string;
  }>;
  homeCare?: {
    activity?: string;
    diet?: string;
    monitoring?: string[];
    woundCare?: string;
  };
  followUp?: {
    required: boolean;
    date?: string;
    reason?: string;
  };
  warningSigns?: string[];
  notes?: string;
}

/**
 * Discharge summary record
 * Maps to: discharge_summaries table
 */
export interface DischargeSummary {
  id: string;
  caseId: string;
  content: string; // Plain text content
  structuredContent: StructuredDischargeContent | null; // JSON sections
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// SOAP Notes (from soap_notes table)
// =============================================================================

/**
 * SOAP note record
 * Maps to: soap_notes table
 */
export interface SoapNote {
  id: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  clientInstructions: string | null;
  createdAt: string;
}

// =============================================================================
// Structured Intel Data (from AI analysis)
// =============================================================================

export interface CallOutcomeData {
  call_outcome?: string;
  conversation_stage_reached?: string;
  owner_available?: boolean;
  call_duration_appropriate?: boolean;
}

export interface PetHealthData {
  pet_recovery_status?: string;
  symptoms_reported?: string[];
  new_concerns_raised?: boolean;
  condition_resolved?: boolean;
}

export interface MedicationComplianceData {
  medication_discussed?: boolean;
  medication_compliance?: string;
  medication_issues?: string[];
  medication_guidance_provided?: boolean;
}

export interface OwnerSentimentData {
  owner_sentiment?: string;
  owner_engagement_level?: string;
  expressed_gratitude?: boolean;
  expressed_concern_about_care?: boolean;
}

export interface EscalationData {
  escalation_triggered?: boolean;
  escalation_type?: string;
  transfer_attempted?: boolean;
  transfer_successful?: boolean;
  escalation_reason?: string;
}

export interface FollowUpData {
  recheck_reminder_delivered?: boolean;
  recheck_confirmed?: boolean;
  appointment_requested?: boolean;
  follow_up_call_needed?: boolean;
  follow_up_reason?: string;
}

// =============================================================================
// Scheduled Call (from scheduled_discharge_calls)
// =============================================================================

/**
 * Scheduled discharge call record
 * Maps to: scheduled_discharge_calls table
 */
export interface ScheduledCall {
  id: string;
  userId: string;
  caseId: string | null;
  vapiCallId: string | null;
  customerPhone: string | null;
  scheduledFor: Date | null;
  status: CallStatus;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
  stereoRecordingUrl?: string | null;
  transcript: string | null;
  cleanedTranscript: string | null;
  summary: string | null;
  structuredData?: Record<string, unknown> | null;
  successEvaluation: string | null;
  userSentiment: "positive" | "neutral" | "negative" | null;
  reviewCategory: ReviewCategory;
  endedReason: string | null;
  cost: number | null;
  dynamicVariables: Record<string, unknown>; // Call script variables
  metadata: {
    retry_count?: number;
    max_retries?: number;
    timezone?: string;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scheduled discharge email record
 * Maps to: scheduled_discharge_emails table
 */
export interface ScheduledEmail {
  id: string;
  userId: string;
  caseId: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  scheduledFor: Date;
  status: EmailStatus;
  sentAt: Date | null;
  resendEmailId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Main Discharge Case (Composite for UI)
// =============================================================================

/**
 * Main discharge case interface for the queue table
 * Joins: cases + patients + discharge_summaries + scheduled_calls + scheduled_emails + soap_notes
 */
export interface DischargeCase {
  // Case identifiers
  id: string; // cases.id
  caseId: string;

  // Patient & owner
  patient: Patient;
  owner: Owner;

  // Case details
  caseType: CaseType | null;
  caseStatus: string | null; // Changed from CaseStatus | null to support raw string
  veterinarian: string; // From entity_extraction or user

  // Derived status for UI
  status: DischargeCaseStatus;

  // Delivery status indicators
  phoneSent: DeliveryStatus;
  emailSent: DeliveryStatus;

  // Content
  dischargeSummary: string;
  structuredContent: StructuredDischargeContent | null;
  callScript: string; // Generated from dynamic_variables
  emailContent: string;

  // Clinical notes
  idexxNotes: string | null; // IDEXX Neo consultation notes (from metadata.idexx.consultation_notes, fallback to metadata.idexx.notes)
  soapNotes: SoapNote[]; // SOAP notes from soap_notes table

  // Scheduling
  scheduledCall: ScheduledCall | null;
  scheduledEmail: ScheduledEmail | null;
  scheduledEmailFor: Date | string | null; // Support string ISO
  scheduledCallFor: Date | string | null; // Support string ISO

  // Timestamps
  timestamp: Date | string; // cases.created_at or cases.scheduled_at
  createdAt: Date | string;
  updatedAt: Date | string;

  // Failure info
  failureReason?: string;

  // Safety check
  extremeCaseCheck?: {
    isBlocked: boolean;
    reason: string;
    confidence: number;
    checkedAt: string;
    category: string;
  };

  // Star status
  isStarred?: boolean;

  // Attention fields
  attentionTypes: string[] | null;
  attentionSeverity: string | null;
  attentionFlaggedAt: string | null;
  attentionSummary: string | null;
  needsAttention: boolean;

  // Intel fields
  callOutcomeData?: CallOutcomeData | null;
  petHealthData?: PetHealthData | null;
  medicationComplianceData?: MedicationComplianceData | null;
  ownerSentimentData?: OwnerSentimentData | null;
  escalationData?: EscalationData | null;
  followUpData?: FollowUpData | null;
}

/**
 * Transformed Scheduled Call (with string dates for tRPC serialization)
 */
export type TransformedScheduledCall = Omit<
  ScheduledCall,
  "scheduledFor" | "startedAt" | "endedAt" | "createdAt" | "updatedAt"
> & {
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Transformed Scheduled Email (with string dates for tRPC serialization)
 */
export type TransformedScheduledEmail = Omit<
  ScheduledEmail,
  "scheduledFor" | "sentAt" | "createdAt" | "updatedAt"
> & {
  scheduledFor: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Interface for Transformed Case data from TRPC (with string dates)
 */
export interface TransformedCase extends Omit<
  DischargeCase,
  | "timestamp"
  | "createdAt"
  | "updatedAt"
  | "scheduledCallFor"
  | "scheduledEmailFor"
  | "patient"
  | "scheduledCall"
  | "scheduledEmail"
> {
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  patient: Omit<Patient, "dateOfBirth"> & { dateOfBirth: string | null };
  scheduledCall: TransformedScheduledCall | null;
  scheduledEmail: TransformedScheduledEmail | null;
}

// =============================================================================
// Summary Statistics
// =============================================================================

/**
 * Failure counts by category for the dashboard
 */
export interface FailureCategoryCounts {
  silenceTimeout: number; // silence-timed-out
  noAnswer: number; // dial-no-answer, customer-did-not-answer
  connectionError: number; // SIP errors, failed-to-connect
  voicemail: number; // voicemail detection
  emailFailed: number; // Email delivery failures
  other: number; // Other/unknown failures
}

/**
 * Attention severity breakdown counts
 */
export interface AttentionSeverityBreakdown {
  critical: number;
  urgent: number;
  routine: number;
}

/**
 * Summary statistics for the dashboard
 * Aligned with new StatusFilter values
 */
export interface DischargeSummaryStats {
  readyToSend: number; // Cases ready to approve (was pendingReview)
  scheduled: number; // Waiting for scheduled time
  sent: number; // Successfully delivered (was completed)
  failed: number; // Delivery failed (total)
  failureCategories: FailureCategoryCounts; // Breakdown by failure reason
  total: number;
  needsReview: number; // Cases missing contact info
  needsAttention: number; // Cases flagged as needing attention by AI
  needsAttentionBreakdown?: AttentionSeverityBreakdown; // Breakdown by severity
}

// =============================================================================
// Filter & UI State
// =============================================================================

/**
 * View mode for the outbound dashboard
 * - all: Default view showing all discharges
 * - needs_review: Cases missing phone or email contact info
 * - needs_attention: Cases flagged by AI with attention types
 */
export type ViewMode = "all" | "needs_review" | "needs_attention";

/**
 * Failure category for filtering failed cases by specific reason
 * Maps to: scheduled_discharge_calls.ended_reason patterns
 */
export type FailureCategory =
  | "all_failed" // All failures combined
  | "silence_timeout" // Call ended due to silence timeout
  | "no_answer" // Customer did not answer
  | "connection_error" // SIP/connection errors
  | "voicemail" // Reached voicemail
  | "email_failed" // Email delivery failed
  | "other"; // Other/unknown failure reasons

/**
 * Status filter for the discharge queue
 * Maps to new simplified filter tabs
 */
export type StatusFilter =
  | "all"
  | "ready_to_send" // pending_review - ready to approve and schedule
  | "scheduled" // scheduled - waiting for scheduled time
  | "sent" // completed - successfully delivered
  | "failed" // failed - delivery failed (shows all failures)
  | FailureCategory; // Specific failure category filters

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Filter state for the case table
 */
export interface OutboundFiltersState {
  status: StatusFilter;
  viewMode: ViewMode;
  searchTerm: string;
  dateRange: {
    start: string;
    end: string;
  };
  veterinarianId?: string;
  reviewCategory?: ReviewCategory | "all";
}

/**
 * Panel configuration for resizable split view
 */
export interface PanelConfig {
  leftPanelSize: number;
  rightPanelCollapsed: boolean;
}

/**
 * Preview tab options
 */
export type PreviewTab = "call_script" | "email";

/**
 * Delivery toggles for case actions
 */
export interface DeliveryToggles {
  phoneEnabled: boolean;
  emailEnabled: boolean;
  /** When true, sends immediately instead of using scheduled delays (useful for test mode) */
  immediateDelivery?: boolean;
}

// =============================================================================
// User Settings (from users table)
// =============================================================================

/**
 * User discharge settings
 * Maps to: users table discharge-related columns
 */
export interface UserDischargeSettings {
  preferredEmailStartTime: string; // HH:MM:SS
  preferredEmailEndTime: string;
  preferredCallStartTime: string;
  preferredCallEndTime: string;
  emailDelayDays: number;
  callDelayDays: number;
  maxCallRetries: number;
  testModeEnabled: boolean;
  voicemailDetectionEnabled: boolean;
  voicemailHangupOnDetection: boolean;
}

// =============================================================================
// Batch Operations (from discharge_batches)
// =============================================================================

/**
 * Batch operation status
 * Maps to: discharge_batches.status CHECK constraint
 */
export type BatchStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "partial_success";

/**
 * Batch item status
 * Maps to: discharge_batch_items.status CHECK constraint
 */
export type BatchItemStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "skipped";

/**
 * Discharge batch record
 * Maps to: discharge_batches table
 */
export interface DischargeBatch {
  id: string;
  userId: string | null;
  status: BatchStatus;
  totalCases: number;
  processedCases: number;
  successfulCases: number;
  failedCases: number;
  emailScheduleTime: Date;
  callScheduleTime: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  errorSummary: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

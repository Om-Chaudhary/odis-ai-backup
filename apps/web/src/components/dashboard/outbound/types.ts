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
 */
export interface StructuredDischargeContent {
  patientName?: string;
  visitSummary?: string;
  diagnosis?: string;
  treatmentsToday?: string;
  medications?: string;
  homeCare?: string;
  followUp?: string;
  warningSigns?: string;
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
  transcript: string | null;
  summary: string | null;
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
  caseStatus: CaseStatus | null;
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
  scheduledEmailFor: Date | null; // When email will be sent
  scheduledCallFor: Date | null; // When call will be made

  // Timestamps
  timestamp: Date; // cases.created_at or cases.scheduled_at
  createdAt: Date;
  updatedAt: Date;

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
}

// =============================================================================
// Summary Statistics
// =============================================================================

/**
 * Summary statistics for the dashboard
 * Aligned with new StatusFilter values
 */
export interface DischargeSummaryStats {
  readyToSend: number; // Cases ready to approve (was pendingReview)
  scheduled: number; // Waiting for scheduled time
  sent: number; // Successfully delivered (was completed)
  failed: number; // Delivery failed
  total: number;
  needsReview: number; // Cases missing contact info
  needsAttention: number; // Cases flagged as urgent by AI
}

// =============================================================================
// Filter & UI State
// =============================================================================

/**
 * View mode for the outbound dashboard
 * - all: Default view showing all discharges
 * - needs_review: Cases missing phone or email contact info
 * - needs_attention: Cases flagged as urgent by AI (urgent_case structured output)
 */
export type ViewMode = "all" | "needs_review" | "needs_attention";

/**
 * Status filter for the discharge queue
 * Maps to new simplified filter tabs
 */
export type StatusFilter =
  | "all"
  | "ready_to_send" // pending_review - ready to approve and schedule
  | "scheduled" // scheduled - waiting for scheduled time
  | "sent" // completed - successfully delivered
  | "failed"; // failed - delivery failed

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

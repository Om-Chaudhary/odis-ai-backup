export type CallStatus =
  | "queued"
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | null;

export type EmailStatus = "queued" | "sent" | "failed" | "cancelled" | null;

export type CaseStatus = "draft" | "ongoing" | "completed" | "reviewed";

/**
 * Discharge readiness filter options
 */
export type DischargeReadinessFilter =
  | "all"
  | "ready_for_discharge"
  | "not_ready";

export interface TranscriptMessage {
  role: "assistant" | "user" | "system";
  message: string;
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
}

/**
 * Vapi Call Analysis Structure
 */
export interface CallAnalysis {
  summary?: string;
  structuredData?: Record<string, unknown>;
  successEvaluation?: string | boolean;
  sentiment?: string;
}

/**
 * Detailed Call Information
 */
export interface CallDetails {
  id: string;
  status: CallStatus;
  scheduled_for: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  transcript: string | null;
  call_analysis: CallAnalysis | null;
  cost: number | null;
  customer_phone: string | null;
  case_id: string | null;
  ended_reason?: string | null;
  metadata?: {
    test_call?: boolean;
    [key: string]: unknown;
  } | null;
  patient?: {
    id: string;
    name: string;
    species: string;
    owner_name: string;
  };
}

/**
 * Backend response type - matches Supabase relation structure
 */
export interface BackendCase {
  id: string;
  status: CaseStatus;
  source: string | null;
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null;
  created_at: string;
  scheduled_at: string | null;
  metadata?: {
    idexx?: {
      notes?: string;
      client_id?: string;
      patient_id?: string;
      client_name?: string;
      provider_id?: string;
      client_email?: string;
      client_phone?: string;
      extracted_at?: string;
      patient_name?: string;
      patient_breed?: string | null;
      provider_name?: string;
      appointment_id?: string;
      extracted_from?: string;
      patient_species?: string | null;
      appointment_type?: string;
      appointment_reason?: string;
      appointment_status?: string;
      appointment_duration?: number;
    };
    [key: string]: unknown;
  } | null;
  patients: Array<{
    id: string;
    name: string;
    species: string;
    breed: string;
    owner_name: string;
    owner_email: string | null;
    owner_phone: string;
  }>;
  discharge_summaries?: Array<{
    id: string;
    content: string;
    structured_content?: Record<string, unknown> | null;
    created_at: string;
  }>;
  soap_notes?: Array<{
    id: string;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
  }>;
  transcriptions?: Array<{
    id: string;
    transcript: string;
  }>;
  scheduled_discharge_calls: Array<{
    id: string;
    status: CallStatus;
    scheduled_for: string | null;
    ended_at: string | null;
    ended_reason: string | null;
    vapi_call_id: string | null;
    transcript: string | null;
    transcript_messages: TranscriptMessage[] | null;
    call_analysis: CallAnalysis | null;
    summary: string | null;
    success_evaluation: string | null;
    structured_data: Record<string, unknown> | null;
    user_sentiment: string | null;
    recording_url: string | null;
    stereo_recording_url: string | null;
    metadata?: {
      test_call?: boolean;
      [key: string]: unknown;
    } | null;
    duration_seconds: number | null;
    cost: number | null;
    created_at: string;
  }>;
  scheduled_discharge_emails: Array<{
    id: string;
    status: EmailStatus;
    scheduled_for: string | null;
    sent_at: string | null;
    created_at: string;
  }>;
}

/**
 * UI-friendly case type - transformed from backend response
 */
export interface DashboardCase {
  id: string;
  status: CaseStatus;
  source: string | null;
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null;
  created_at: string;
  scheduled_at: string | null;
  patient: {
    id: string;
    name: string;
    species: string;
    breed: string;
    owner_name: string;
    owner_email: string;
    owner_phone: string;
  };
  discharge_summary?: {
    id: string;
    content: string;
    created_at: string;
  };
  /** Indicates if this case has clinical notes (SOAP notes, transcriptions, or discharge summaries) */
  has_clinical_notes: boolean;
  /** Indicates if this case is ready for discharge (has content + valid contact) */
  is_ready_for_discharge: boolean;
  /** List of requirements missing for discharge readiness */
  missing_requirements: string[];
  /** IDEXX clinical notes if case is from IDEXX */
  idexxNotes?: string | null;
  scheduled_discharge_calls: Array<{
    id: string;
    status: CallStatus;
    scheduled_for: string | null;
    ended_at: string | null;
    ended_reason: string | null;
    vapi_call_id: string | null;
    transcript: string | null;
    recording_url: string | null;
    duration_seconds: number | null;
    created_at: string;
  }>;
  scheduled_discharge_emails: Array<{
    id: string;
    status: EmailStatus;
    scheduled_for: string | null;
    sent_at: string | null;
    created_at: string;
  }>;
}

/**
 * Discharge settings - matches backend camelCase response
 */
export interface DischargeSettings {
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  emergencyPhone: string;
  vetName: string;
  testModeEnabled?: boolean;
  testContactName?: string;
  testContactEmail?: string;
  testContactPhone?: string;
  voicemailDetectionEnabled?: boolean;
  voicemailHangupOnDetection?: boolean; // When true, hang up on voicemail; when false, leave message
  voicemailMessage?: string | null; // Custom voicemail message (used when hangup is false)
  defaultScheduleDelayMinutes?: number | null; // Override default scheduling delay (null = use defaults)
  // Email branding settings
  primaryColor?: string; // Hex color for email branding (e.g., "#2563EB")
  logoUrl?: string | null; // URL to clinic logo for email header
  emailHeaderText?: string | null; // Custom header text for emails
  emailFooterText?: string | null; // Custom footer text for emails
  // Outbound discharge scheduling settings
  preferredEmailStartTime?: string | null; // HH:mm format (default: "10:00" business hours)
  preferredEmailEndTime?: string | null; // HH:mm format (e.g., "12:00")
  preferredCallStartTime?: string | null; // HH:mm format (default: "16:00" for 4-7 PM window)
  preferredCallEndTime?: string | null; // HH:mm format (default: "19:00" for 4-7 PM window)
  emailDelayDays?: number | null; // Days after appointment to send email (default: 1)
  callDelayDays?: number | null; // Days after email to make call (default: 2)
  maxCallRetries?: number | null; // Max retry attempts for failed calls (default: 3)
  // Batch discharge preferences
  batchIncludeIdexxNotes?: boolean; // Include IDEXX Neo cases with consultation notes
  batchIncludeManualTranscriptions?: boolean; // Include manual cases with transcriptions/SOAP
  // VAPI Configuration - inbound calls
  inboundPhoneNumberId?: string | null; // VAPI phone number ID for receiving inbound calls
  inboundAssistantId?: string | null; // VAPI assistant ID for handling inbound calls
  // VAPI Configuration - outbound calls (optional overrides)
  outboundPhoneNumberId?: string | null; // VAPI phone number ID for outbound caller ID
  outboundAssistantId?: string | null; // VAPI assistant ID for outbound discharge calls
}

/**
 * Eligible case for batch discharge processing
 */
export interface BatchEligibleCase {
  id: string;
  patientId: string;
  patientName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  source: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
  hasDischargeSummary: boolean;
  hasIdexxNotes: boolean;
  hasTranscription: boolean;
  hasSoapNotes: boolean;
  createdAt: string;
  scheduledAt: string | null;
  /** Whether email has already been sent/scheduled for this case */
  emailSent: boolean;
  /** Whether call has already been made/scheduled for this case */
  callSent: boolean;
}

export interface PatientUpdateInput {
  id: string;
  name?: string;
  species?: string;
  breed?: string;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
}

export interface TriggerDischargeInput {
  caseId: string;
  patientId: string;
  patientData: {
    name?: string;
    species?: string;
    breed?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPhone?: string;
  };
  dischargeType: "call" | "email" | "both";
}

/**
 * Detailed case view - extends BackendCase with proper typing
 */
export interface DetailedCase extends BackendCase {
  transcriptions?: Array<{
    id: string;
    transcript: string;
    created_at: string;
  }>;
  soap_notes?: Array<{
    id: string;
    subjective?: string | null;
    objective?: string | null;
    assessment?: string | null;
    plan?: string | null;
    created_at: string;
  }>;
  scheduled_discharge_calls: Array<{
    id: string;
    status: CallStatus;
    scheduled_for: string | null;
    ended_at: string | null;
    ended_reason: string | null;
    vapi_call_id: string | null;
    created_at: string;
    transcript: string | null;
    transcript_messages: TranscriptMessage[] | null;
    call_analysis: CallAnalysis | null;
    summary: string | null;
    success_evaluation: string | null;
    structured_data: Record<string, unknown> | null;
    user_sentiment: string | null;
    recording_url: string | null;
    stereo_recording_url: string | null;
    duration_seconds: number | null;
    cost: number | null;
  }>;
  scheduled_discharge_emails: Array<{
    id: string;
    status: EmailStatus;
    scheduled_for: string | null;
    sent_at: string | null;
    created_at: string;
  }>;
}

/**
 * Discharge timeline item for displaying call/email history
 */
export interface DischargeTimeline {
  type: "call" | "email";
  status: CallStatus | EmailStatus;
  scheduledFor: string | null;
  completedAt: string | null;
  id: string;
  createdAt: string;
}

/**
 * Dashboard quick stats
 */
export interface DashboardStats {
  activeCases: number;
  completedCalls: number;
  pendingCalls: number;
  successRate: number;
  trends: {
    cases: "up" | "down" | "stable";
    calls: "up" | "down" | "stable";
  };
}

/**
 * Activity item for timeline
 */
export interface ActivityItem {
  id: string;
  type:
    | "case_created"
    | "call_completed"
    | "call_scheduled"
    | "discharge_summary";
  timestamp: string;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Daily activity aggregate for timeline view
 */
export interface DailyActivityAggregate {
  date: string;
  dateLabel: string; // e.g., "Today", "Yesterday", "Jan 15"
  casesCreated: number;
  dischargeSummariesGenerated: number;
  callsCompleted: number;
  callsScheduled: number;
  emailsSent: number;
  soapNotesCreated: number;
}

/**
 * Weekly activity data point for chart
 */
export interface WeeklyActivityData {
  date: string;
  cases: number;
  calls: number;
  completedCalls: number;
}

/**
 * Call performance metrics
 */
export interface CallPerformanceMetrics {
  totalCalls: number;
  averageDuration: number;
  totalCost: number;
  successRate: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

/**
 * Upcoming scheduled item
 */
export interface UpcomingItem {
  id: string;
  type: "call" | "email";
  scheduledFor: string | null;
  status: CallStatus | EmailStatus;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Case list item for dashboard cases tab
 */
export interface CaseListItem {
  id: string;
  status: CaseStatus;
  source: string | null;
  type: "checkup" | "emergency" | "surgery" | "follow_up" | null;
  created_at: string;
  scheduled_at?: string;
  is_starred: boolean;
  patient: {
    id: string;
    name: string;
    species: string;
    owner_name: string;
  };
  hasSoapNote: boolean;
  hasDischargeSummary: boolean;
  hasDischargeCall: boolean;
  hasDischargeEmail: boolean;
  soapNoteTimestamp?: string;
  dischargeSummaryTimestamp?: string;
  dischargeCallTimestamp?: string;
  dischargeEmailTimestamp?: string;
}

/**
 * Comprehensive case statistics for dashboard overview
 */
export interface CaseStats {
  total: number;
  thisWeek: number;
  byStatus: Record<CaseStatus, number>;
  bySource: Record<string, number>;
  soapNotes: number;
  dischargeSummaries: number;
  callsCompleted: number;
  emailsSent: number;
  casesNeedingDischarge: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  casesNeedingSoap: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  soapCoverage: {
    percentage: number;
    totalCases: number;
    casesWithSoap: number;
    casesNeedingSoap: number;
  };
  dischargeCoverage: {
    percentage: number;
    totalCases: number;
    casesWithDischarge: number;
    casesNeedingDischarge: number;
  };
  completionRate: {
    overall: {
      completed: number;
      total: number;
      percentage: number;
    };
    thisWeek: {
      completed: number;
      created: number;
      percentage: number;
    };
    thisMonth: {
      completed: number;
      created: number;
      percentage: number;
    };
  };
}

/**
 * Attention type for cases flagged during calls
 * Represents different categories of concerns raised by pet owners
 */
export type AttentionType =
  | "health_concern"
  | "callback_request"
  | "medication_question"
  | "appointment_needed"
  | "dissatisfaction"
  | "billing_question"
  | "emergency_signs";

/**
 * Attention severity levels
 * Used to prioritize cases in the dashboard
 */
export type AttentionSeverity = "routine" | "urgent" | "critical";

/**
 * Attention information for flagged cases
 */
export interface AttentionInfo {
  types: AttentionType[];
  severity: AttentionSeverity;
  flaggedAt: string;
  summary: string | null;
}

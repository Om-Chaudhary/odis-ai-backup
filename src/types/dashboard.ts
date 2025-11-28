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
  created_at: string;
  scheduled_at: string | null;
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
  scheduled_discharge_calls: Array<{
    id: string;
    status: CallStatus;
    scheduled_for: string | null;
    ended_at: string | null;
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
  defaultScheduleDelayMinutes?: number | null; // Override default scheduling delay (null = use defaults)
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
  created_at: string;
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

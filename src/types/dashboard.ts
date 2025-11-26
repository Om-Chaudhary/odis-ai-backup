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
  }>;
  scheduled_discharge_emails: Array<{
    id: string;
    status: EmailStatus;
    scheduled_for: string | null;
    sent_at: string | null;
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
  scheduled_discharge_call?: {
    id: string;
    status: CallStatus;
    scheduled_for: string | null;
    ended_at: string | null;
    vapi_call_id: string | null;
  };
  scheduled_discharge_email?: {
    id: string;
    status: EmailStatus;
    scheduled_for: string | null;
    sent_at: string | null;
  };
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

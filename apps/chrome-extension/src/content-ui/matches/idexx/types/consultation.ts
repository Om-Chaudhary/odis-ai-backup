/**
 * IDEXX Neo Consultation API Types
 * Based on /consultations/[id]/page-data endpoint
 *
 * This is different from the appointments API - consultation data includes
 * detailed patient info, discharge summaries, and provider details needed
 * for scheduling follow-up discharge calls.
 */

/**
 * Provider information from consultation
 */
export interface IdexxProvider {
  id: number;
  name: string;
  email: string;
  licenseNumber: string;
  userType: 'Vet' | 'Nurse' | 'Tech' | string;
  companyId: number;
}

/**
 * Patient information from consultation
 */
export interface IdexxPatient {
  id: number;
  name: string;
  species: string;
  breed: string;
  dateOfBirth?: string;
  sex?: string;
  weight?: number;
  weightUnit?: string;
}

/**
 * Client/Owner information from consultation
 */
export interface IdexxClient {
  id: number;
  firstName: string;
  lastName: string;

  // Multiple phone number fields (may vary by IDEXX API endpoint)
  phone?: string; // Generic phone field
  homePhone?: string;
  mobilePhone?: string;
  workPhone?: string;
  phoneNumber?: string; // Alternative field name

  email?: string;
  taxExempt?: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

/**
 * Consultation details
 */
export interface IdexxConsultation {
  id: number;
  consultationId?: string;
  reason: string;
  notes: string;
  dischargeSummary?: string;
  date: string;
  status: 'in_progress' | 'completed' | 'cancelled' | string;
}

/**
 * Clinic/Practice information
 */
export interface IdexxClinic {
  id: number;
  name: string;
  phone: string;
  email: string;
  companyId: number;
}

/**
 * Consultation line item (product/service)
 * Represents items from the consultation-lines-table and consultation-declined-lines-table
 */
export interface IdexxConsultationLine {
  id: number;
  productService: string; // Product/Service name
  label?: string; // Optional label
  soldAtLocal: string; // Date sold
  provider?: {
    id: number;
    name: string;
  };
  quantity: number;
  lineTotalExcTax: number; // Price excluding tax
  isDeclined?: boolean; // Whether this item was declined by the client
  batchNo?: string; // Optional batch number for products
}

/**
 * Full page data structure from IDEXX consultation endpoint
 * Based on actual API response from /consultations/[id]/page-data
 */
export interface IdexxConsultationPageData {
  // Root-level data
  consultation: IdexxConsultation;
  patient: IdexxPatient;
  client: IdexxClient;

  // Nested pageData contains providers and other config
  pageData: {
    providers: IdexxProvider[];
    discountTypes?: unknown[];
    taxRates?: unknown[];
    procedureTemplates?: unknown[];
    canEditPriceExcTax?: boolean;
    [key: string]: unknown;
  };

  // Optional fields
  clientBranch?: {
    id: number;
    name: string;
    sapId?: number;
  };
  consultationLines?: IdexxConsultationLine[];
  consultationNotes?: unknown;
  vitalSignGroup?: unknown;
  [key: string]: unknown;
}

/**
 * Call request format for backend VAPI API
 * NOTE: This interface is maintained for backward compatibility.
 * Internally, ScheduleCallApi converts this to the new /api/cases/ingest format (V2 API).
 *
 * The backend will transform these fields into VAPI dynamic variables:
 * - petName → pet_name
 * - ownerName → owner_name
 * - vetName → vet_name (agentName in VAPI)
 * - clinicName → clinic_name
 * - clinicPhone → clinic_phone
 * - dischargeSummary → discharge_summary_content
 */
export interface ScheduleCallRequest {
  phoneNumber: string;
  petName: string;
  ownerName: string;
  vetName?: string;
  clinicName?: string;
  clinicPhone?: string;
  dischargeSummary?: string;
  scheduledFor: string; // ISO 8601 timestamp
  notes?: string;
  timezone?: string;

  // Metadata for tracking
  metadata?: {
    source: 'idexx_neo';
    consultation_id: number;
    provider_id: number;
    company_id: number;
    patient_external_id?: string;
  };
}

/**
 * Response from schedule call API
 */
export interface ScheduleCallResponse {
  success: boolean;
  data?: {
    callId: string;
    scheduledFor: string;
    qstashMessageId?: string;
  };
  error?: string;
}

/**
 * Scheduled call item returned from /api/calls/scheduled
 */
export interface ScheduledCall {
  callId: string;
  scheduledFor: string;
  phoneNumber?: string;
  petName?: string;
  ownerName?: string;
  vetName?: string;
  clinicName?: string;
  qstashMessageId?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

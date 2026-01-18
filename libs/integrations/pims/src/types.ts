/**
 * PIMS Provider Types
 *
 * Core interfaces for PIMS system integration.
 * Each PIMS provider (IDEXX, eVetPractice, etc.) implements these interfaces.
 */

// ============================================
// Core Data Types
// ============================================

export interface PimsPatient {
  id: string;
  name: string;
  species: string;
  breed: string;
  dateOfBirth?: string;
  sex?: "male" | "female" | "neutered_male" | "spayed_female" | "unknown";
  weight?: number;
  weightUnit?: "kg" | "lbs";
  microchipId?: string;
  color?: string;
}

export interface PimsClient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phones: PimsPhone[];
  address?: PimsAddress;
  preferredContactMethod?: "phone" | "email" | "sms";
}

export interface PimsPhone {
  type: "mobile" | "home" | "work" | "other";
  number: string;
  isPrimary: boolean;
  canReceiveSms?: boolean;
}

export interface PimsAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface PimsProvider {
  id: string;
  name: string;
  email?: string;
  role: "veterinarian" | "technician" | "nurse" | "receptionist" | "other";
  licenseNumber?: string;
}

export interface PimsConsultation {
  id: string;
  patientId: string;
  clientId: string;
  date: string;
  reason?: string;
  notes?: string;
  dischargeSummary?: string;
  status: PimsConsultationStatus;
  providers: PimsProvider[];
  billingItems?: PimsBillingItem[];
}

export type PimsConsultationStatus =
  | "scheduled"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface PimsBillingItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;
  isDeclined: boolean;
  category?: string;
}

export interface PimsAppointment {
  id: string;
  consultationId?: string;
  patientId: string;
  clientId: string;
  patientName?: string;
  clientName?: string;
  startTime: string;
  endTime: string;
  status: PimsAppointmentStatus;
  reason?: string;
  provider?: PimsProvider;
  room?: string;
}

export type PimsAppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

// ============================================
// Provider Interface
// ============================================

/**
 * Interface for PIMS provider implementations.
 *
 * Each PIMS system (IDEXX Neo, eVetPractice, Cornerstone, etc.)
 * implements this interface to provide a unified API for the extension.
 */
export interface IPimsProvider {
  // ============================================
  // Identification
  // ============================================

  /** Unique identifier for this PIMS provider (e.g., "idexx", "evetpractice") */
  readonly name: string;

  /** Human-readable display name (e.g., "IDEXX Neo", "eVetPractice") */
  readonly displayName: string;

  /** URL patterns that this provider handles (for content script matching) */
  readonly urlPatterns: string[];

  // ============================================
  // Detection
  // ============================================

  /** Check if we're currently on a page handled by this provider */
  isActive(): boolean;

  /** Check if we're on a consultation/visit detail page */
  isOnConsultationPage(): boolean;

  /** Check if we're on a schedule/calendar page */
  isOnSchedulePage(): boolean;

  /** Get the current consultation ID from the URL or page */
  getCurrentConsultationId(): string | null;

  // ============================================
  // Data Fetching
  // ============================================

  /** Fetch consultation details by ID */
  getConsultation(id: string): Promise<PimsConsultation | null>;

  /** Fetch patient details by ID */
  getPatient(id: string): Promise<PimsPatient | null>;

  /** Fetch client details by ID */
  getClient(id: string): Promise<PimsClient | null>;

  /** Fetch client by consultation ID (convenience method) */
  getClientByConsultation(consultationId: string): Promise<PimsClient | null>;

  /** Fetch appointments for a date range */
  getAppointments(
    startDate: string,
    endDate: string,
  ): Promise<PimsAppointment[]>;

  // ============================================
  // UI Integration
  // ============================================

  /** Get the container element where the menu bar should be injected */
  getMenuBarContainer(): HTMLElement | null;

  /** Check if the menu bar has already been injected */
  isMenuBarInjected(): boolean;

  // ============================================
  // Actions
  // ============================================

  /** Insert content into the current note/document editor */
  insertNote(content: string): Promise<boolean>;

  /** Replace the current note content with a template */
  applyTemplate(template: string): Promise<boolean>;

  // ============================================
  // Lifecycle
  // ============================================

  /** Initialize the provider (called once when activated) */
  initialize?(): Promise<void>;

  /** Cleanup when provider is deactivated */
  cleanup?(): void;
}

// ============================================
// Provider Configuration
// ============================================

export interface PimsProviderConfig {
  /** Provider name */
  name: string;
  /** Whether the provider is enabled */
  enabled: boolean;
  /** Custom configuration options */
  options?: Record<string, unknown>;
}

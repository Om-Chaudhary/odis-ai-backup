/**
 * TypeScript types for IDEXX Neo API responses
 *
 * IDEXX Neo is a veterinary practice management system.
 * These types represent the data structure from the consultation page-data endpoint.
 */

export interface IdexxPageData {
  pageData: {
    providers: IdexxStaffMember[];
    patient: IdexxPatient;
    client: IdexxClient;
    consultation: IdexxConsultation;
    clinic: IdexxClinic;
  };
}

/**
 * Represents a staff member (vet, nurse, tech) in IDEXX Neo
 * @note Renamed from IdexxProvider to avoid conflict with IdexxProvider class
 */
export interface IdexxStaffMember {
  id: number;
  name: string;
  email: string;
  licenseNumber: string;
  userType: "Vet" | "Nurse" | "Tech";
  companyId: number;
}

export interface IdexxPatient {
  id: number;
  name: string;
  species: string;
  breed: string;
  dateOfBirth?: string;
  sex?: string;
  weight?: number;
}

export interface IdexxClient {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface IdexxConsultation {
  id: number;
  consultationId: string;
  reason: string;
  notes: string;
  dischargeSummary?: string;
  date: string;
  status: "in_progress" | "completed" | "cancelled";
}

export interface IdexxClinic {
  id: number;
  name: string;
  phone: string;
  email: string;
  companyId: number;
}

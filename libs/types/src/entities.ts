/**
 * Entity Type Definitions
 *
 * Standalone type definitions for normalized entities.
 * These mirror the Zod schemas in @odis-ai/validators but without the runtime validation.
 * This allows the types lib to remain independent of the validators lib (module boundary compliance).
 */

/* ========================================
   Patient Types
   ======================================== */

/**
 * Patient information extracted from clinical input
 */
export interface ExtractedPatient {
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "other" | "unknown";
  breed?: string;
  age?: string;
  sex?: "male" | "female" | "unknown";
  weight?: string;
  owner: {
    name: string;
    phone?: string;
    email?: string;
  };
}

/* ========================================
   Clinical Types
   ======================================== */

/**
 * Medication information
 */
export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  route?: string;
}

/**
 * Vaccination information
 */
export interface Vaccination {
  name: string;
  manufacturer?: string;
  lotNumber?: string;
}

/**
 * Vital signs from exam
 */
export interface VitalSigns {
  temperature?: string;
  heartRate?: string;
  respiratoryRate?: string;
  weight?: string;
}

/**
 * Clinical details extracted from input
 */
export interface ClinicalDetails {
  // Visit information
  chiefComplaint?: string;
  visitReason?: string;
  presentingSymptoms?: string[];

  // Vital signs & exam
  vitalSigns?: VitalSigns;
  physicalExamFindings?: string[];

  // Diagnoses
  diagnoses?: string[];
  differentialDiagnoses?: string[];

  // Medications & treatments
  medications?: Medication[];
  vaccinations?: Vaccination[];
  treatments?: string[];
  procedures?: string[];

  // Follow-up
  followUpInstructions?: string;
  followUpDate?: string;
  recheckRequired?: boolean;

  // Test results
  labResults?: string[];
  imagingResults?: string[];

  // Additional notes
  clinicalNotes?: string;
  prognosis?: string;

  // Billing information (from IDEXX consultations)
  productsServicesProvided?: string[];
  productsServicesDeclined?: string[];
}

/* ========================================
   Case Types
   ======================================== */

/**
 * Case type classification
 */
export type CaseType =
  | "checkup"
  | "emergency"
  | "surgery"
  | "follow_up"
  | "dental"
  | "vaccination"
  | "diagnostic"
  | "consultation"
  | "exam"
  | "euthanasia"
  | "other"
  | "unknown";

/**
 * Confidence scores for entity extraction
 */
export interface ExtractionConfidence {
  overall: number;
  patient: number;
  clinical: number;
}

/**
 * Complete normalized entities structure
 * This gets stored in case.metadata
 */
export interface NormalizedEntities {
  patient: ExtractedPatient;
  clinical: ClinicalDetails;
  caseType: CaseType;
  confidence: ExtractionConfidence;
  warnings?: string[];
  extractedAt?: string;
  originalInput?: string;
  inputType?: string;
}

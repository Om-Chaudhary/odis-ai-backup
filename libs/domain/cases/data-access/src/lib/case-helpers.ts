/**
 * Case Helper Functions
 *
 * Utility functions for case data transformation and mapping.
 */

import type { Database } from "@odis-ai/shared/types";
import type { NormalizedEntities } from "@odis-ai/shared/validators";
// eslint-disable-next-line @nx/enforce-module-boundaries -- Shared types are a core dependency
import { parseBillingString } from "@odis-ai/shared/types/idexx";
import { parseSpecies } from "./entity-utils";

/**
 * Map case type string to database enum value
 */
export function mapCaseTypeToDb(
  type: string,
): Database["public"]["Enums"]["CaseType"] {
  const map: Record<string, Database["public"]["Enums"]["CaseType"]> = {
    checkup: "checkup",
    vaccination: "checkup",
    consultation: "checkup",
    exam: "checkup",
    emergency: "emergency",
    surgery: "surgery",
    dental: "surgery",
    follow_up: "follow_up",
    diagnostic: "follow_up",
    euthanasia: "follow_up",
    other: "follow_up",
    unknown: "checkup",
  };
  return map[type] ?? "checkup";
}

/**
 * Map raw IDEXX data to NormalizedEntities format
 */
export function mapIdexxToEntities(
  data: Record<string, unknown>,
): NormalizedEntities {
  const petName = typeof data.pet_name === "string" ? data.pet_name : "Unknown";
  const rawSpecies =
    typeof data.species === "string" ? data.species : "unknown";
  const species = parseSpecies(rawSpecies);

  const clientFirstName =
    typeof data.client_first_name === "string" ? data.client_first_name : "";
  const clientLastName =
    typeof data.client_last_name === "string" ? data.client_last_name : "";
  const ownerName =
    typeof data.owner_name === "string" ? data.owner_name : "Unknown";
  const phone =
    typeof data.phone_number === "string"
      ? data.phone_number
      : typeof data.mobile_number === "string"
        ? data.mobile_number
        : undefined;
  const email = typeof data.email === "string" ? data.email : undefined;

  const acceptedItems = parseBillingString(
    data.products_services as string | undefined,
    false,
  );
  const declinedItems = parseBillingString(
    data.declined_products_services as string | undefined,
    true,
  );

  const productsServicesProvided =
    acceptedItems.length > 0
      ? acceptedItems.map((item) =>
          item.quantity > 1
            ? `${item.productService} (Qty: ${item.quantity})`
            : item.productService,
        )
      : undefined;

  const productsServicesDeclined =
    declinedItems.length > 0
      ? declinedItems.map((item) =>
          item.quantity > 1
            ? `${item.productService} (Qty: ${item.quantity})`
            : item.productService,
        )
      : undefined;

  return {
    patient: {
      name: petName,
      species: species,
      owner: {
        name:
          clientFirstName && clientLastName
            ? `${clientFirstName} ${clientLastName}`
            : ownerName,
        phone: phone,
        email: email,
      },
    },
    clinical: {
      medications: [],
      diagnoses: [],
      productsServicesProvided,
      productsServicesDeclined,
    },
    caseType: "checkup",
    confidence: { overall: 0.5, patient: 0.5, clinical: 0.5 },
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Parse weight string to number
 */
export function parseWeight(weightStr?: string | null): number | null {
  if (!weightStr) return null;
  const num = parseFloat(weightStr);
  return isNaN(num) ? null : num;
}

/**
 * Parse IDEXX appointment date/time into ISO timestamp
 */
export function parseScheduledAt(
  rawData?: Record<string, unknown> | null,
): string | null {
  if (!rawData) return null;

  const appointmentDate = rawData.appointment_date as string | undefined;
  const appointmentTime = rawData.appointment_time as string | undefined;

  if (!appointmentDate) return null;

  try {
    if (appointmentTime) {
      const dateTime = new Date(`${appointmentDate}T${appointmentTime}:00`);
      if (!isNaN(dateTime.getTime())) {
        return dateTime.toISOString();
      }
    }
    const dateOnly = new Date(appointmentDate);
    if (!isNaN(dateOnly.getTime())) {
      return dateOnly.toISOString();
    }
  } catch {
    // Invalid date format
  }

  return null;
}

/**
 * Generate a summary string from entities
 */
export function generateSummaryFromEntities(
  entities: NormalizedEntities,
): string {
  const parts = [];
  if (entities.clinical.diagnoses?.length) {
    parts.push(`Diagnoses: ${entities.clinical.diagnoses.join(", ")}.`);
  }
  if (entities.clinical.medications?.length) {
    const medList = entities.clinical.medications
      .map((m) => `${m.name} (${m.dosage ?? ""}, ${m.frequency ?? ""})`)
      .join("; ");
    parts.push(`Medications: ${medList}.`);
  }
  if (entities.clinical.followUpInstructions) {
    parts.push(`Instructions: ${entities.clinical.followUpInstructions}`);
  }
  return parts.join(" ");
}

/**
 * Normalize array or single value to array
 * Handles Supabase query results that may return single object or array
 */
export function normalizeToArray<T>(value: T | T[] | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Get first item from array or single value
 * Handles Supabase query results that may return single object or array
 */
export function getFirstOrNull<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Standardized case types for cadence configuration.
 * These map to entries in the clinic_case_type_cadence table.
 */
export type StandardizedCaseType =
  | "euthanasia"
  | "surgery"
  | "wellness_exam"
  | "sick_visit"
  | "dental"
  | "emergency"
  | "vaccination"
  | "follow_up"
  | "general";

/**
 * Detect standardized case type from IDEXX data.
 *
 * Maps IDEXX appointment_type, reason, and invoice data to
 * standardized case types used for cadence configuration.
 *
 * @param idexxData - Raw IDEXX consultation/appointment data
 * @returns Standardized case type for cadence lookup
 */
export function detectCaseTypeFromIdexx(
  idexxData: Record<string, unknown> | null,
): StandardizedCaseType {
  if (!idexxData) return "general";

  // Extract relevant fields
  const appointmentType =
    (idexxData.appointment_type as string)?.toLowerCase() ?? "";
  const appointmentReason =
    (idexxData.appointment_reason as string)?.toLowerCase() ??
    (idexxData.reason as string)?.toLowerCase() ??
    "";
  const productsServices =
    (idexxData.products_services as string)?.toLowerCase() ?? "";
  const chiefComplaint =
    (idexxData.chief_complaint as string)?.toLowerCase() ?? "";

  // Combine text for pattern matching
  const allText = `${appointmentType} ${appointmentReason} ${productsServices} ${chiefComplaint}`;

  // Euthanasia detection - high priority, should never auto-schedule
  const euthanasiaPatterns = [
    "euthanasia",
    "euth",
    "put to sleep",
    "humane end",
    "end of life",
    "quality of life",
    "pts",
    "pallative",
    "hospice",
  ];
  if (euthanasiaPatterns.some((p) => allText.includes(p))) {
    return "euthanasia";
  }

  // Emergency detection
  const emergencyPatterns = [
    "emergency",
    "urgent",
    "critical",
    "trauma",
    "hit by car",
    "hbc",
    "poison",
    "toxin",
    "bloat",
    "gdv",
    "seizure",
    "collapse",
    "unresponsive",
    "difficulty breathing",
    "dyspnea",
  ];
  if (emergencyPatterns.some((p) => allText.includes(p))) {
    return "emergency";
  }

  // Surgery detection
  const surgeryPatterns = [
    "surgery",
    "surgical",
    "spay",
    "neuter",
    "castration",
    "ovariohysterectomy",
    "mass removal",
    "tumor removal",
    "amputation",
    "exploratory",
    "laparotomy",
    "cystotomy",
    "gastropexy",
    "orthopedic",
    "tplo",
    "fho",
    "cruciate",
  ];
  if (surgeryPatterns.some((p) => allText.includes(p))) {
    return "surgery";
  }

  // Dental detection
  const dentalPatterns = [
    "dental",
    "teeth cleaning",
    "tooth extraction",
    "periodontal",
    "prophy",
    "prophylaxis",
    "dentistry",
    "oral surgery",
  ];
  if (dentalPatterns.some((p) => allText.includes(p))) {
    return "dental";
  }

  // Vaccination detection
  const vaccinationPatterns = [
    "vaccine",
    "vaccination",
    "booster",
    "rabies",
    "dhpp",
    "fvrcp",
    "bordetella",
    "leptospirosis",
    "lyme",
    "influenza",
    "distemper",
    "parvo",
  ];
  if (vaccinationPatterns.some((p) => allText.includes(p))) {
    return "vaccination";
  }

  // Wellness exam detection
  const wellnessPatterns = [
    "wellness",
    "well visit",
    "annual",
    "yearly",
    "checkup",
    "check-up",
    "routine exam",
    "preventive",
    "health check",
    "physical exam",
  ];
  if (wellnessPatterns.some((p) => allText.includes(p))) {
    return "wellness_exam";
  }

  // Follow-up detection
  const followUpPatterns = [
    "follow up",
    "follow-up",
    "followup",
    "recheck",
    "re-check",
    "progress exam",
    "suture removal",
    "post-op",
    "postop",
    "post operative",
  ];
  if (followUpPatterns.some((p) => allText.includes(p))) {
    return "follow_up";
  }

  // Sick visit detection
  const sickVisitPatterns = [
    "sick",
    "illness",
    "not eating",
    "vomiting",
    "diarrhea",
    "lethargy",
    "lameness",
    "limping",
    "coughing",
    "sneezing",
    "discharge",
    "itching",
    "scratching",
    "skin problem",
    "ear infection",
    "uti",
    "bladder",
  ];
  if (sickVisitPatterns.some((p) => allText.includes(p))) {
    return "sick_visit";
  }

  // Default to general
  return "general";
}

/**
 * Entity Utilities
 *
 * Pure functions for entity validation, enrichment, and merging.
 * Extracted from cases-service.ts for modularity and testability.
 */

import type { NormalizedEntities } from "@odis-ai/shared/validators";
import type { Database } from "@odis-ai/shared/types";
import { getFirstOrNull } from "./case-helpers";
import { parseBillingString } from "@odis-ai/shared/types/idexx";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

/**
 * Check if entities are missing critical fields
 */
export function isEntitiesIncomplete(entities: NormalizedEntities): boolean {
  const missingFields = getMissingEntityFields(entities);
  // Consider incomplete if missing species, breed, age, or weight
  return (
    missingFields.includes("species") ||
    missingFields.includes("breed") ||
    missingFields.includes("age") ||
    missingFields.includes("weight")
  );
}

/**
 * Get list of missing entity fields
 */
export function getMissingEntityFields(entities: NormalizedEntities): string[] {
  const missing: string[] = [];
  if (!entities.patient.species || entities.patient.species === "unknown") {
    missing.push("species");
  }
  if (!entities.patient.breed) {
    missing.push("breed");
  }
  if (!entities.patient.age) {
    missing.push("age");
  }
  if (!entities.patient.weight) {
    missing.push("weight");
  }
  return missing;
}

/**
 * Enrich entities with database patient values
 *
 * Database values take priority over AI-extracted metadata values.
 * This ensures accurate patient information even when AI extraction fails.
 *
 * @param entities - The entities object to enrich (modified in place)
 * @param patient - Patient record from database (single or array)
 */
export function enrichEntitiesWithPatient(
  entities: NormalizedEntities | undefined,
  patient: PatientRow | PatientRow[] | null,
): void {
  if (!entities) return;

  const patientData = getFirstOrNull(patient);
  if (!patientData) return;

  // Enrich patient name from database (database takes priority)
  if (patientData.name && patientData.name.trim() !== "") {
    entities.patient.name = patientData.name;
  }

  // Enrich patient demographics from database
  if (patientData.species) {
    entities.patient.species =
      patientData.species as NormalizedEntities["patient"]["species"];
  }
  if (patientData.breed) {
    entities.patient.breed = patientData.breed;
  }
  if (patientData.sex) {
    entities.patient.sex =
      patientData.sex as NormalizedEntities["patient"]["sex"];
  }
  if (patientData.weight_kg) {
    entities.patient.weight = `${patientData.weight_kg} kg`;
  }

  // Enrich owner information from database
  if (patientData.owner_name) {
    entities.patient.owner.name = patientData.owner_name;
  }
  if (patientData.owner_phone) {
    entities.patient.owner.phone = patientData.owner_phone;
  }
  if (patientData.owner_email) {
    entities.patient.owner.email = patientData.owner_email;
  }

  console.log("[EntityUtils] Enriched entities with patient database values", {
    enrichedFields: {
      name: patientData.name,
      species: patientData.species,
      breed: patientData.breed,
      sex: patientData.sex,
      weight: patientData.weight_kg,
      ownerName: patientData.owner_name,
      ownerPhone: patientData.owner_phone,
    },
  });
}

/**
 * Get list of successfully extracted fields (for logging)
 */
export function getExtractedFields(entities: NormalizedEntities): string[] {
  const extracted: string[] = [];
  if (entities.patient.species && entities.patient.species !== "unknown") {
    extracted.push("species");
  }
  if (entities.patient.breed) {
    extracted.push("breed");
  }
  if (entities.patient.age) {
    extracted.push("age");
  }
  if (entities.patient.weight) {
    extracted.push("weight");
  }
  return extracted;
}

/**
 * Merge two entity sets, with extractedEntities taking precedence for missing fields
 * Used when re-extracting from transcription to fill in missing data
 */
export function mergeEntitiesForExtraction(
  existing: NormalizedEntities,
  extracted: NormalizedEntities,
): NormalizedEntities {
  return {
    ...existing,
    patient: {
      ...existing.patient,
      // Use extracted values if existing is missing/unknown
      species:
        existing.patient.species && existing.patient.species !== "unknown"
          ? existing.patient.species
          : (extracted.patient.species ?? existing.patient.species),
      breed: existing.patient.breed ?? extracted.patient.breed,
      age: existing.patient.age ?? extracted.patient.age,
      sex:
        existing.patient.sex && existing.patient.sex !== "unknown"
          ? existing.patient.sex
          : (extracted.patient.sex ?? existing.patient.sex),
      weight: existing.patient.weight ?? extracted.patient.weight,
      owner: {
        ...existing.patient.owner,
        name: existing.patient.owner.name ?? extracted.patient.owner.name,
        phone: existing.patient.owner.phone ?? extracted.patient.owner.phone,
        email: existing.patient.owner.email ?? extracted.patient.owner.email,
      },
    },
    clinical: {
      ...existing.clinical,
      // Merge clinical data, preferring extracted for missing fields
      chiefComplaint:
        existing.clinical.chiefComplaint ?? extracted.clinical.chiefComplaint,
      visitReason:
        existing.clinical.visitReason ?? extracted.clinical.visitReason,
      presentingSymptoms:
        (existing.clinical.presentingSymptoms?.length ?? 0 > 0)
          ? existing.clinical.presentingSymptoms
          : extracted.clinical.presentingSymptoms,
      diagnoses:
        (existing.clinical.diagnoses?.length ?? 0 > 0)
          ? existing.clinical.diagnoses
          : extracted.clinical.diagnoses,
      medications:
        (existing.clinical.medications?.length ?? 0 > 0)
          ? existing.clinical.medications
          : extracted.clinical.medications,
      followUpInstructions:
        existing.clinical.followUpInstructions ??
        extracted.clinical.followUpInstructions,
      recheckRequired:
        existing.clinical.recheckRequired ?? extracted.clinical.recheckRequired,
    },
    // Keep existing caseType and confidence, but update extractedAt
    caseType: existing.caseType ?? extracted.caseType,
    confidence: existing.confidence,
    extractedAt: extracted.extractedAt ?? existing.extractedAt,
    warnings: [
      ...(existing.warnings ?? []),
      ...(extracted.warnings ?? []),
    ].filter((w, i, arr) => arr.indexOf(w) === i), // Remove duplicates
  };
}

/**
 * Merge logic for entities during case update
 * Currently replaces existing entities with incoming data
 * TODO: Implement smart merge strategy if needed (preserve non-conflicting fields)
 */
export function mergeEntities(
  _current: NormalizedEntities | undefined,
  incoming: NormalizedEntities,
): NormalizedEntities {
  return incoming;
}

/**
 * IDEXX metadata structure for entity extraction
 */
export interface IdexxMetadata {
  pet_name?: string;
  patient_name?: string;
  patient_species?: string;
  patient_breed?: string;
  species?: string;
  breed?: string;
  client_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  owner_name?: string;
  client_phone?: string;
  client_email?: string;
  appointment_reason?: string;
  appointment_type?: string;
  products_services?: string;
  consultation_notes?: string;
  notes?: string;
  provider_name?: string;
}

/**
 * Patient data subset for entity building
 */
export interface PatientDataForEntities {
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
}

const VALID_SPECIES = [
  "dog",
  "cat",
  "bird",
  "rabbit",
  "other",
  "unknown",
] as const;
type ValidSpecies = (typeof VALID_SPECIES)[number];

/**
 * Parse species string to valid species enum value
 */
export function parseSpecies(speciesRaw: string): ValidSpecies {
  const speciesLower = speciesRaw.toLowerCase();
  return VALID_SPECIES.includes(speciesLower as ValidSpecies)
    ? (speciesLower as ValidSpecies)
    : "unknown";
}

/**
 * Parse procedures from comma/semicolon separated string
 */
function parseProcedures(productsServices: string | undefined): string[] {
  if (!productsServices) return [];
  return productsServices
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Determine case type from appointment type string
 */
function determineCaseType(
  appointmentType: string | undefined,
): NormalizedEntities["caseType"] {
  if (!appointmentType) return "exam";

  const lower = appointmentType.toLowerCase();
  if (lower.includes("follow")) return "follow_up";
  if (lower.includes("surgery")) return "surgery";
  if (lower.includes("dental")) return "dental";
  if (lower.includes("vaccine") || lower.includes("vaccination"))
    return "vaccination";
  if (lower.includes("emergency")) return "emergency";
  if (lower.includes("checkup") || lower.includes("wellness")) return "checkup";
  return "exam";
}

/**
 * Strip HTML tags and decode entities from consultation notes
 */
function cleanConsultationNotes(notes: string): string {
  return notes
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Enrich entities with IDEXX metadata
 * Applies IDEXX-specific fields to an entities object
 */
export function enrichEntitiesWithIdexxMetadata(
  entities: NormalizedEntities,
  rawIdexxData: Record<string, unknown>,
): void {
  if (rawIdexxData.pet_name) {
    entities.patient.name = rawIdexxData.pet_name as string;
  }
  if (rawIdexxData.species) {
    entities.patient.species = parseSpecies(rawIdexxData.species as string);
  }
  if (rawIdexxData.breed) {
    entities.patient.breed = rawIdexxData.breed as string;
  }

  const clientFirstName = rawIdexxData.client_first_name as string | undefined;
  const clientLastName = rawIdexxData.client_last_name as string | undefined;
  const ownerName = rawIdexxData.owner_name as string | undefined;

  if (clientFirstName && clientLastName) {
    entities.patient.owner.name = `${clientFirstName} ${clientLastName}`;
  } else if (ownerName) {
    entities.patient.owner.name = ownerName;
  }

  const phone =
    (rawIdexxData.phone_number as string | undefined) ??
    (rawIdexxData.mobile_number as string | undefined);
  if (phone) {
    entities.patient.owner.phone = phone;
  }

  const email = rawIdexxData.email as string | undefined;
  if (email) {
    entities.patient.owner.email = email;
  }

  const acceptedItems = parseBillingString(
    rawIdexxData.products_services as string | undefined,
    false,
  );
  const declinedItems = parseBillingString(
    rawIdexxData.declined_products_services as string | undefined,
    true,
  );

  if (acceptedItems.length > 0) {
    entities.clinical.productsServicesProvided = acceptedItems.map((item) =>
      item.quantity > 1
        ? `${item.productService} (Qty: ${item.quantity})`
        : item.productService,
    );
  }
  if (declinedItems.length > 0) {
    entities.clinical.productsServicesDeclined = declinedItems.map((item) =>
      item.quantity > 1
        ? `${item.productService} (Qty: ${item.quantity})`
        : item.productService,
    );
  }
}

/**
 * Builds NormalizedEntities from IDEXX metadata when AI extraction isn't possible
 * (e.g., consultation_notes too short for AI extraction)
 */
export function buildEntitiesFromIdexxMetadata(
  idexx: IdexxMetadata,
  patient: PatientDataForEntities | null,
): NormalizedEntities {
  // Build owner name from available sources
  let ownerName =
    idexx.client_name ?? idexx.owner_name ?? patient?.owner_name ?? "unknown";
  if (
    ownerName === "unknown" &&
    idexx.client_first_name &&
    idexx.client_last_name
  ) {
    ownerName = `${idexx.client_first_name} ${idexx.client_last_name}`.trim();
  }

  // Determine species
  const speciesRaw =
    idexx.patient_species ?? idexx.species ?? patient?.species ?? "unknown";
  const species = parseSpecies(speciesRaw);

  // Parse procedures from products_services
  const procedures = parseProcedures(idexx.products_services);

  // Determine case type from appointment_type
  const caseType = determineCaseType(idexx.appointment_type);

  // Build clinical notes from available sources
  let followUpInstructions: string | undefined;
  if (idexx.consultation_notes) {
    followUpInstructions = cleanConsultationNotes(idexx.consultation_notes);
  } else if (idexx.notes) {
    followUpInstructions = idexx.notes;
  }

  return {
    patient: {
      name: idexx.pet_name ?? idexx.patient_name ?? patient?.name ?? "unknown",
      species,
      breed: idexx.patient_breed ?? idexx.breed ?? patient?.breed ?? undefined,
      owner: {
        name: ownerName,
        phone: idexx.client_phone ?? patient?.owner_phone ?? undefined,
        email: idexx.client_email ?? patient?.owner_email ?? undefined,
      },
    },
    clinical: {
      visitReason: idexx.appointment_reason ?? undefined,
      chiefComplaint: idexx.appointment_reason ?? undefined,
      procedures: procedures.length > 0 ? procedures : undefined,
      followUpInstructions,
      productsServicesProvided: procedures.length > 0 ? procedures : undefined,
    },
    caseType,
    confidence: { overall: 0.7, patient: 0.7, clinical: 0.6 }, // Lower confidence since not AI-extracted
  };
}

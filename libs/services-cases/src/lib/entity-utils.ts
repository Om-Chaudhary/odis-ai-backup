/**
 * Entity Utilities
 *
 * Pure functions for entity validation, enrichment, and merging.
 * Extracted from cases-service.ts for modularity and testability.
 */

import type { NormalizedEntities } from "@odis-ai/validators";
import type { Database } from "@odis-ai/types";

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
  if (!entities || !patient) {
    return;
  }

  // Handle both single patient and array of patients
  const patientData = Array.isArray(patient) ? patient[0] : patient;

  if (!patientData) {
    return;
  }

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
 * Merge logic for entities (used during case creation/update)
 */
export function mergeEntities(
  current: NormalizedEntities | undefined,
  incoming: NormalizedEntities,
): NormalizedEntities {
  if (!current) return incoming;
  return incoming;
}

/**
 * Database Transaction Helpers for Entity Extraction Storage
 *
 * Stores extracted clinical entities in case.metadata JSONB field.
 * This is Step 1 of the two-step process: normalize → generate
 *
 * IMPORTANT: This ONLY stores entities - it does NOT generate SOAP notes
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/database.types";
import type { NormalizedEntities } from "~/lib/validators/scribe";
import {
  parseWeightToKg,
  parseAgeToDOB,
  sanitizePhoneNumber,
} from "~/lib/validators/scribe";

/* ========================================
   Type Definitions
   ======================================== */

type Tables = Database["public"]["Tables"];
type CaseInsert = Tables["cases"]["Insert"];
type CaseUpdate = Tables["cases"]["Update"];

/**
 * Map extracted case types to database case types
 * Database only supports: checkup, emergency, surgery, follow_up
 * Note: euthanasia maps to follow_up for DB, but discharge blocking happens at entity level
 */
function mapCaseTypeToDb(
  caseType: string,
): "checkup" | "emergency" | "surgery" | "follow_up" {
  switch (caseType) {
    case "checkup":
    case "vaccination":
    case "consultation":
    case "exam":
      return "checkup";
    case "emergency":
      return "emergency";
    case "surgery":
    case "dental":
      return "surgery";
    case "follow_up":
    case "diagnostic":
    case "euthanasia": // DB doesn't have euthanasia type, but we check entities.caseType for discharge blocking
    case "other":
    default:
      return "follow_up";
  }
}
type PatientInsert = Tables["patients"]["Insert"];

/**
 * Result of entity storage operation
 */
export interface StoredEntitiesResult {
  success: true;
  case: {
    id: string;
    type: string;
    status: string;
    metadata: Record<string, unknown>;
    created_at: string;
  };
  patient: {
    id: string;
    name: string;
    species: string;
    owner_name: string;
  };
  entities: NormalizedEntities;
}

/**
 * Error result
 */
export interface StorageError {
  success: false;
  error: string;
  details?: unknown;
}

export type StorageTransaction = StoredEntitiesResult | StorageError;

/* ========================================
   Main Storage Function
   ======================================== */

/**
 * Store extracted entities in case.metadata
 *
 * If caseId provided: Updates existing case's metadata
 * If no caseId: Creates new case with entities in metadata
 *
 * Always upserts patient (deduplicates by name/owner/species)
 *
 * @param supabase - Supabase client
 * @param userId - User ID storing the entities
 * @param entities - Extracted entities from AI
 * @param caseId - Optional existing case ID to update
 * @param additionalMetadata - Optional extra metadata for the case
 * @returns Result with case ID, patient ID, and stored entities
 */
export async function storeNormalizedEntities(
  supabase: SupabaseClient<Database>,
  userId: string,
  entities: NormalizedEntities,
  caseId?: string,
  additionalMetadata?: Record<string, unknown>,
): Promise<StorageTransaction> {
  try {
    // Prepare metadata with entities
    const metadata = {
      ...additionalMetadata,
      entities: entities, // Store full extracted entities
      confidence: entities.confidence,
      warnings: entities.warnings ?? [],
      extractedAt: entities.extractedAt,
      inputType: entities.inputType,
    };

    let caseRecord: {
      id: string;
      type: string;
      status: string;
      metadata: Record<string, unknown>;
      created_at: string;
    };

    // Step 1: Create or update case
    if (caseId) {
      // Update existing case
      const caseUpdate: CaseUpdate = {
        type: mapCaseTypeToDb(entities.caseType),
        metadata: metadata,
      };

      const { data: updatedCase, error: updateError } = await supabase
        .from("cases")
        .update(caseUpdate)
        .eq("id", caseId)
        .eq("user_id", userId) // Ensure user owns this case
        .select("id, type, status, metadata, created_at")
        .single();

      if (updateError || !updatedCase) {
        return {
          success: false,
          error: "Failed to update case",
          details: updateError,
        };
      }

      caseRecord = updatedCase as typeof caseRecord;
    } else {
      // Create new case
      const caseData: CaseInsert = {
        user_id: userId,
        type: mapCaseTypeToDb(entities.caseType),
        status: "draft",
        visibility: "private",
        metadata: metadata,
        source: "ai_entity_extraction",
      };

      const { data: newCase, error: createError } = await supabase
        .from("cases")
        .insert(caseData)
        .select("id, type, status, metadata, created_at")
        .single();

      if (createError || !newCase) {
        return {
          success: false,
          error: "Failed to create case",
          details: createError,
        };
      }

      caseRecord = newCase as typeof caseRecord;
    }

    // Step 2: Upsert patient
    const patientResult = await upsertPatient(
      supabase,
      userId,
      caseRecord.id,
      entities.patient,
    );

    if (!patientResult.success) {
      // If this was a new case, rollback
      if (!caseId) {
        await supabase.from("cases").delete().eq("id", caseRecord.id);
      }
      return patientResult;
    }

    // Success! Return stored data
    return {
      success: true,
      case: caseRecord,
      patient: patientResult.patient,
      entities: entities,
    };
  } catch (error) {
    console.error("Unexpected error in storeNormalizedEntities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    };
  }
}

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Upsert patient (find existing or create new)
 *
 * Deduplicates patients based on name + owner name + species.
 * If a match is found, updates case_id. Otherwise, creates new patient.
 */
async function upsertPatient(
  supabase: SupabaseClient<Database>,
  userId: string,
  caseId: string,
  patient: NormalizedEntities["patient"],
): Promise<
  | {
      success: true;
      patient: {
        id: string;
        name: string;
        species: string;
        owner_name: string;
      };
    }
  | StorageError
> {
  try {
    // Parse weight and date of birth
    const weightKg = parseWeightToKg(patient.weight);
    const dateOfBirth = parseAgeToDOB(patient.age);
    const ownerPhone = sanitizePhoneNumber(patient.owner.phone);

    // Check for existing patient (deduplicate)
    const { data: existingPatients } = await supabase
      .from("patients")
      .select("id, name, species, owner_name")
      .eq("user_id", userId)
      .ilike("name", patient.name)
      .ilike("owner_name", patient.owner.name)
      .eq("species", patient.species)
      .limit(1);

    if (existingPatients && existingPatients.length > 0) {
      const existingPatient = existingPatients[0];

      if (!existingPatient) {
        // Should not happen but TS needs this check
        return {
          success: false,
          error: "Patient not found",
          details: null,
        };
      }

      // Update case_id for existing patient
      const { error: updateError } = await supabase
        .from("patients")
        .update({ case_id: caseId })
        .eq("id", existingPatient.id);

      if (updateError) {
        return {
          success: false,
          error: "Failed to update existing patient",
          details: updateError,
        };
      }

      return {
        success: true,
        patient: {
          ...existingPatient,
          species: existingPatient.species ?? "unknown",
          owner_name: existingPatient.owner_name ?? "Unknown",
        },
      };
    }

    // Create new patient
    const patientData: PatientInsert = {
      user_id: userId,
      case_id: caseId,
      name: patient.name,
      species: patient.species,
      breed: patient.breed ?? null,
      sex: patient.sex ?? null,
      date_of_birth: dateOfBirth ?? null,
      weight_kg: weightKg ?? null,
      owner_name: patient.owner.name,
      owner_email: patient.owner.email ?? null,
      owner_phone: ownerPhone ?? null,
    };

    const { data: newPatient, error: insertError } = await supabase
      .from("patients")
      .insert(patientData)
      .select("id, name, species, owner_name")
      .single();

    if (insertError || !newPatient) {
      return {
        success: false,
        error: "Failed to create patient",
        details: insertError,
      };
    }

    return {
      success: true,
      patient: {
        ...newPatient,
        species: newPatient.species ?? "unknown",
        owner_name: newPatient.owner_name ?? "Unknown",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown patient error",
      details: error,
    };
  }
}

/* ========================================
   Query Helpers
   ======================================== */

/**
 * Fetch case with extracted entities
 *
 * Retrieves case with entities from metadata field
 */
export async function fetchCaseWithEntities(
  supabase: SupabaseClient<Database>,
  caseId: string,
  userId: string,
): Promise<
  | {
      success: true;
      case: {
        id: string;
        type: string;
        status: string;
        metadata: Record<string, unknown>;
        created_at: string;
      };
      entities: NormalizedEntities | null;
      patient: { id: string; name: string; species: string } | null;
    }
  | StorageError
> {
  try {
    // Fetch case
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("id, type, status, metadata, created_at")
      .eq("id", caseId)
      .eq("user_id", userId)
      .single();

    if (caseError || !caseData) {
      return {
        success: false,
        error: "Case not found or access denied",
        details: caseError,
      };
    }

    // Extract entities from metadata
    const metadata = caseData.metadata as Record<string, unknown> | null;
    const entities = metadata?.entities as NormalizedEntities | null;

    // Fetch patient (if exists)
    const { data: patientData } = await supabase
      .from("patients")
      .select("id, name, species")
      .eq("case_id", caseId)
      .single();

    return {
      success: true,
      case: caseData as {
        id: string;
        type: string;
        status: string;
        metadata: Record<string, unknown>;
        created_at: string;
      },
      entities: entities ?? null,
      patient: patientData
        ? {
            ...patientData,
            species: patientData.species ?? "unknown",
          }
        : null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown fetch error",
      details: error,
    };
  }
}

/**
 * Check if case has extracted entities
 *
 * Used to determine if case has been normalized
 */
export async function hasExtractedEntities(
  supabase: SupabaseClient<Database>,
  caseId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("cases")
    .select("metadata")
    .eq("id", caseId)
    .single();

  if (error || !data) return false;

  const metadata = data.metadata as Record<string, unknown> | null;
  return !!metadata?.entities;
}

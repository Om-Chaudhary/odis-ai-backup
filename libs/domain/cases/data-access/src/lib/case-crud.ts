/**
 * Case CRUD Operations
 *
 * Create, read, update, delete operations for cases.
 */

import type { Database, Json } from "@odis-ai/shared/types";
import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { NormalizedEntities } from "@odis-ai/shared/validators";
import type {
  CaseMetadata,
  CaseMetadataJson,
} from "@odis-ai/shared/types/case";
import { buildIdexxConsultationData } from "@odis-ai/shared/types/idexx";
import { mergeEntities } from "./entity-utils";
import { mapCaseTypeToDb, parseWeight, parseScheduledAt } from "./case-helpers";
import { resolveClientIdentity } from "./client-identity";

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
type CaseInsert = Database["public"]["Tables"]["cases"]["Insert"];
type CaseUpdate = Database["public"]["Tables"]["cases"]["Update"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
type TranscriptionInsert =
  Database["public"]["Tables"]["transcriptions"]["Insert"];

export interface CreateOrUpdateCaseContext {
  rawIdexxData?: Record<string, unknown> | null;
  transcriptionText?: string | null;
  source: string;
}

export interface CaseWithEntities {
  case: CaseRow;
  entities: NormalizedEntities | undefined;
  patient: PatientRow | PatientRow[] | null;
  soapNotes: Database["public"]["Tables"]["soap_notes"]["Row"][] | null;
  dischargeSummaries:
    | Database["public"]["Tables"]["discharge_summaries"]["Row"][]
    | null;
  metadata: CaseMetadata;
}

/**
 * Find existing case or create new one, merging data
 */
export async function createOrUpdateCase(
  supabase: SupabaseClientType,
  userId: string,
  entities: NormalizedEntities,
  context: CreateOrUpdateCaseContext,
): Promise<{ caseId: string; entities: NormalizedEntities }> {
  let caseId: string | null = null;

  // 1. Check by external_id (IDEXX appointment ID)
  const idexxAppointmentId =
    (context.rawIdexxData?.appointmentId as string | undefined) ??
    (context.rawIdexxData?.id as string | undefined);

  if (idexxAppointmentId && context.source === "idexx_extension") {
    const externalId = `idexx-appt-${idexxAppointmentId}`;
    const { data: existingByExtId, error: extIdError } = await supabase
      .from("cases")
      .select("id")
      .eq("external_id", externalId)
      .eq("user_id", userId)
      .maybeSingle();

    if (extIdError) {
      console.error("[CaseCRUD] Error checking external_id:", extIdError);
    }

    if (existingByExtId) {
      console.log("[CaseCRUD] Found existing case by external_id", {
        externalId,
        caseId: existingByExtId.id,
      });
      caseId = existingByExtId.id;
    }
  }

  // NOTE: Removed patient name/owner case matching.
  // Each appointment should create a new case, even for returning patients.
  // Only external_id matching (above) is kept for idempotent ingestion of the same appointment.

  // Resolve client identity (clinic, client, canonical patient)
  const clientIdentity = await resolveClientIdentity(
    supabase,
    userId,
    entities,
  );

  if (clientIdentity) {
    console.log("[CaseCRUD] Resolved client identity", {
      clinicId: clientIdentity.clinicId,
      clientId: clientIdentity.clientId,
      canonicalPatientId: clientIdentity.canonicalPatientId,
      isNewClient: clientIdentity.isNewClient,
      isNewPatient: clientIdentity.isNewPatient,
    });
  }

  if (caseId) {
    // Update existing case
    const { data: currentCase, error: fetchError } = await supabase
      .from("cases")
      .select("metadata")
      .eq("id", caseId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch existing case: ${fetchError.message}`);
    }

    const currentMetadata = (currentCase?.metadata ?? {}) as CaseMetadata;
    const currentEntities = currentMetadata.entities;
    const mergedEntities = mergeEntities(currentEntities, entities);

    const newIdexx = context.rawIdexxData
      ? {
          raw: context.rawIdexxData,
          consultation: buildIdexxConsultationData(context.rawIdexxData),
        }
      : (currentMetadata.idexx ?? null);

    const scheduledAt = parseScheduledAt(context.rawIdexxData);

    const updateData: CaseUpdate = {
      entity_extraction: mergedEntities as unknown as Json,
      metadata: {
        ...currentMetadata,
        entities: mergedEntities,
        idexx: newIdexx,
        last_updated_by: context.source,
      } as CaseMetadata as CaseMetadataJson,
      updated_at: new Date().toISOString(),
      ...(scheduledAt ? { scheduled_at: scheduledAt } : {}),
    };

    const { error: updateError } = await supabase
      .from("cases")
      .update(updateData)
      .eq("id", caseId);

    if (updateError) {
      throw new Error(`Failed to update case: ${updateError.message}`);
    }
  } else {
    // Create new case
    const idexxAppointmentId =
      (context.rawIdexxData?.appointmentId as string | undefined) ??
      (context.rawIdexxData?.id as string | undefined);
    const externalId =
      context.source === "idexx_extension" && idexxAppointmentId
        ? `idexx-appt-${idexxAppointmentId}`
        : null;

    const idexxMetadata = context.rawIdexxData
      ? {
          raw: context.rawIdexxData,
          consultation: buildIdexxConsultationData(context.rawIdexxData),
        }
      : null;

    const scheduledAt = parseScheduledAt(context.rawIdexxData);

    const caseInsert: CaseInsert = {
      user_id: userId,
      clinic_id: clientIdentity?.clinicId ?? null,
      created_by: userId,
      status: "ongoing",
      type: mapCaseTypeToDb(entities.caseType),
      source: context.source,
      external_id: externalId,
      scheduled_at: scheduledAt,
      entity_extraction: entities as unknown as Json,
      metadata: {
        entities: entities,
        idexx: idexxMetadata,
      } as CaseMetadata as CaseMetadataJson,
    };

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert(caseInsert)
      .select()
      .single();

    if (caseError || !newCase) {
      throw new Error(
        `Failed to create case: ${caseError?.message ?? "Unknown error"}`,
      );
    }
    caseId = newCase.id;

    console.log("[CaseCRUD] Created new case", {
      caseId,
      externalId,
      source: context.source,
    });

    // Look up existing patient to copy contact info (phone, email) if not provided
    // Always create a new patient record per case to avoid linking to old case data
    const { data: existingPatient, error: patientSearchError } = await supabase
      .from("patients")
      .select(
        "id, name, owner_name, owner_phone, owner_email, species, breed, sex, weight_kg",
      )
      .eq("user_id", userId)
      .ilike("name", entities.patient.name)
      .ilike("owner_name", entities.patient.owner.name ?? "")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (patientSearchError) {
      console.error(
        "[CaseCRUD] Error searching for existing patient:",
        patientSearchError,
      );
    }

    // Create new patient record, using existing patient data as fallback for missing fields
    const patientInsert: PatientInsert = {
      user_id: userId,
      clinic_id: clientIdentity?.clinicId ?? null,
      canonical_patient_id: clientIdentity?.canonicalPatientId ?? null,
      created_by: userId,
      case_id: caseId,
      name: entities.patient.name,
      species: entities.patient.species ?? existingPatient?.species ?? null,
      breed: entities.patient.breed ?? existingPatient?.breed ?? null,
      sex: entities.patient.sex ?? existingPatient?.sex ?? null,
      weight_kg:
        parseWeight(entities.patient.weight) ??
        existingPatient?.weight_kg ??
        null,
      owner_name:
        entities.patient.owner.name ?? existingPatient?.owner_name ?? null,
      // Copy phone/email from existing patient if not provided in new data
      owner_phone:
        entities.patient.owner.phone ?? existingPatient?.owner_phone ?? null,
      owner_email:
        entities.patient.owner.email ?? existingPatient?.owner_email ?? null,
    };

    const { data: newPatient, error: patientError } = await supabase
      .from("patients")
      .insert(patientInsert)
      .select()
      .single();

    if (patientError) {
      console.error("[CaseCRUD] Error creating patient:", patientError);
    } else if (newPatient) {
      console.log("[CaseCRUD] Created new patient", {
        patientId: newPatient.id,
        patientName: newPatient.name,
        caseId,
        copiedFromExisting: !!existingPatient,
      });
    }
  }

  // Handle transcription
  if (context.transcriptionText && caseId) {
    const transcriptionInsert: TranscriptionInsert = {
      case_id: caseId,
      user_id: userId,
      transcript: context.transcriptionText,
      processing_status: "completed",
    };

    const { error: transcriptionError } = await supabase
      .from("transcriptions")
      .insert(transcriptionInsert);

    if (transcriptionError) {
      console.error(
        "[CaseCRUD] Error creating transcription:",
        transcriptionError,
      );
    }
  }

  if (!caseId) {
    throw new Error("Failed to create or find case");
  }

  return { caseId, entities };
}

/**
 * Get case with entities and patient info
 */
export async function getCaseWithEntities(
  supabase: SupabaseClientType,
  caseId: string,
): Promise<CaseWithEntities | null> {
  const { data: caseData, error } = await supabase
    .from("cases")
    .select(
      `
      *,
      patient:patients(*),
      soap_notes(*),
      discharge_summaries(*)
    `,
    )
    .eq("id", caseId)
    .single();

  if (error || !caseData) {
    return null;
  }

  const metadata = (caseData.metadata ?? {}) as CaseMetadata;
  const entities = (caseData.entity_extraction ?? metadata.entities) as
    | NormalizedEntities
    | undefined;

  const patient = Array.isArray(caseData.patient)
    ? (caseData.patient[0] ?? null)
    : (caseData.patient ?? null);

  const soapNotes = Array.isArray(caseData.soap_notes)
    ? caseData.soap_notes
    : caseData.soap_notes
      ? [caseData.soap_notes]
      : null;

  const dischargeSummaries = Array.isArray(caseData.discharge_summaries)
    ? caseData.discharge_summaries
    : caseData.discharge_summaries
      ? [caseData.discharge_summaries]
      : null;

  return {
    case: caseData,
    entities,
    patient,
    soapNotes,
    dischargeSummaries,
    metadata,
  };
}

/**
 * Delete a case by IDEXX appointment ID (for no-show handling)
 */
export async function deleteNoShowCase(
  supabase: SupabaseClientType,
  userId: string,
  appointmentId: string,
): Promise<boolean> {
  const externalId = `idexx-appt-${appointmentId}`;

  const { data: existingCase } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", userId)
    .eq("external_id", externalId)
    .maybeSingle();

  if (!existingCase) {
    console.log("[CaseCRUD] No case found to delete for no-show", {
      userId,
      appointmentId,
      externalId,
    });
    return false;
  }

  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("user_id", userId)
    .eq("external_id", externalId);

  if (error) {
    console.error("[CaseCRUD] Failed to delete no-show case", {
      userId,
      appointmentId,
      externalId,
      error: error.message,
    });
    return false;
  }

  console.log("[CaseCRUD] Deleted no-show case", {
    userId,
    appointmentId,
    externalId,
    caseId: existingCase.id,
  });

  return true;
}

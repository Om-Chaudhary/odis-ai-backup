import { type NormalizedEntities } from "~/lib/validators/scribe";
import { extractEntitiesWithRetry } from "~/lib/ai/normalize-scribe";
import { scheduleCallExecution } from "~/lib/qstash/client";
import { buildDynamicVariables } from "~/lib/vapi/knowledge-base";
import { env } from "~/env";

// Type imports
import type { Database } from "~/database.types";
import type { SupabaseClientType } from "~/types/supabase";
import type {
  CaseScheduleOptions,
  IngestPayload,
  ScheduledCallMetadata,
  ScheduledDischargeCall,
} from "~/types/services";
import type { CaseMetadata, CaseMetadataJson } from "~/types/case";

// Re-export types for convenience
export type { CaseScheduleOptions, IngestPayload, ScheduledDischargeCall };

/* ========================================
   Type Aliases
   ======================================== */

/**
 * Database table row types
 */
type CaseRow = Database["public"]["Tables"]["cases"]["Row"];
type CaseInsert = Database["public"]["Tables"]["cases"]["Insert"];
type CaseUpdate = Database["public"]["Tables"]["cases"]["Update"];

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];

type TranscriptionInsert =
  Database["public"]["Tables"]["transcriptions"]["Insert"];

/* ========================================
   Service Implementation
   ======================================== */

export const CasesService = {
  /**
   * Main entry point for ingesting case data
   */
  async ingest(
    supabase: SupabaseClientType,
    userId: string,
    payload: IngestPayload,
  ): Promise<{
    caseId: string;
    entities: NormalizedEntities;
    scheduledCall: ScheduledDischargeCall | null;
  }> {
    let entities: NormalizedEntities | null = null;
    let rawIdexxData: Record<string, unknown> | null = null;
    let transcriptionText: string | null = null;

    // 1. Normalize Data
    if (payload.mode === "text") {
      transcriptionText = payload.text;
      // Run AI Normalization
      entities = await extractEntitiesWithRetry(
        payload.text,
        payload.options?.inputType,
      );
    } else {
      // Mode: structured (IDEXX)
      rawIdexxData = payload.data;
      // Check if payload.data looks like NormalizedEntities
      if (payload.data.patient && payload.data.clinical) {
        entities = payload.data as NormalizedEntities;
      } else {
        entities = mapIdexxToEntities(payload.data);
      }
    }

    if (!entities) {
      throw new Error("Failed to extract entities from payload");
    }

    // 2. Find or Create Case (Smart Merge)
    const caseResult = await this.createOrUpdateCase(
      supabase,
      userId,
      entities,
      {
        rawIdexxData,
        transcriptionText,
        source: payload.source,
      },
    );

    // 3. Auto-Schedule if requested
    let scheduledCall = null;
    if (payload.options?.autoSchedule) {
      const scheduledAt = new Date(); // Immediate/Queued

      scheduledCall = await this.scheduleDischargeCall(
        supabase,
        userId,
        caseResult.caseId,
        {
          scheduledAt,
        },
      );
    }

    return {
      caseId: caseResult.caseId,
      entities: caseResult.entities,
      scheduledCall,
    };
  },

  /**
   * Find existing case or create new one, merging data
   */
  async createOrUpdateCase(
    supabase: SupabaseClientType,
    userId: string,
    entities: NormalizedEntities,
    context: {
      rawIdexxData?: Record<string, unknown> | null;
      transcriptionText?: string | null;
      source: string;
    },
  ): Promise<{
    caseId: string;
    entities: NormalizedEntities;
  }> {
    // 1. Try to find existing case for this patient
    // Discharges can be sent anytime after a case is created, so we look for
    // cases within a reasonable window (90 days) that are ongoing or completed
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    // Search for cases with matching patient name and owner
    // Filter by status (ongoing or completed) and recent date
    const { data: existingCases, error: caseSearchError } = await supabase
      .from("cases")
      .select("id, status, created_at, patients!inner(name, owner_name)")
      .eq("patients.name", entities.patient.name)
      .eq("patients.owner_name", entities.patient.owner.name)
      .in("status", ["ongoing", "completed"])
      .gte("created_at", ninetyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (caseSearchError) {
      console.error(
        "[CasesService] Error searching for cases:",
        caseSearchError,
      );
    }

    let caseId: string | null = null;

    if (existingCases && existingCases.length > 0) {
      const match = existingCases[0];
      if (match) {
        caseId = match.id;
      }
    }

    if (caseId) {
      // Update Existing Case (Merge)
      const { data: currentCase, error: fetchError } = await supabase
        .from("cases")
        .select("metadata")
        .eq("id", caseId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch existing case: ${fetchError.message}`);
      }

      const currentMetadata =
        (currentCase?.metadata as CaseMetadata | undefined) ?? {};
      const currentEntities = currentMetadata.entities;

      const mergedEntities = this.mergeEntities(currentEntities, entities);
      const newIdexx = context.rawIdexxData ?? currentMetadata.idexx ?? null;

      const updateData: CaseUpdate = {
        metadata: {
          ...currentMetadata,
          entities: mergedEntities,
          idexx: newIdexx,
          last_updated_by: context.source,
        } as CaseMetadata as CaseMetadataJson,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("cases")
        .update(updateData)
        .eq("id", caseId);

      if (updateError) {
        throw new Error(`Failed to update case: ${updateError.message}`);
      }
    } else {
      // Create New Case
      const caseInsert: CaseInsert = {
        user_id: userId,
        status: "ongoing",
        type: mapCaseTypeToDb(entities.caseType),
        source: context.source,
        metadata: {
          entities: entities,
          idexx: context.rawIdexxData ?? null,
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

      // Create Patient Record
      const patientInsert: PatientInsert = {
        user_id: userId,
        case_id: caseId,
        name: entities.patient.name,
        species: entities.patient.species ?? null,
        breed: entities.patient.breed ?? null,
        sex: entities.patient.sex ?? null,
        weight_kg: parseWeight(entities.patient.weight),
        owner_name: entities.patient.owner.name ?? null,
        owner_phone: entities.patient.owner.phone ?? null,
        owner_email: entities.patient.owner.email ?? null,
      };

      const { data: newPatient, error: patientError } = await supabase
        .from("patients")
        .insert(patientInsert)
        .select()
        .single();

      if (patientError) {
        console.error("[CasesService] Error creating patient:", patientError);
        // Don't throw - case was created successfully, patient is optional
      } else if (newPatient) {
        // Successfully created patient
        // patientId is stored for potential future use
      }
    }

    // Handle Transcription
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
          "[CasesService] Error creating transcription:",
          transcriptionError,
        );
        // Don't throw - transcription is optional
      }
    }

    // TypeScript doesn't know caseId is guaranteed to be set, but logically it always is
    // (either from existing case or newly created case)
    if (!caseId) {
      throw new Error("Failed to create or find case");
    }

    return { caseId, entities };
  },

  /**
   * Get case with entities and patient info
   */
  async getCaseWithEntities(
    supabase: SupabaseClientType,
    caseId: string,
  ): Promise<
    {
      case: CaseRow;
      entities: NormalizedEntities | undefined;
      patient: PatientRow | PatientRow[] | null;
      metadata: CaseMetadata;
    } | null
  > {
    const { data: caseData, error } = await supabase
      .from("cases")
      .select(
        `
                *,
                patient:patients(*)
            `,
      )
      .eq("id", caseId)
      .single();

    if (error || !caseData) {
      return null;
    }

    const metadata = (caseData.metadata as CaseMetadata | undefined) ?? {};
    const entities = metadata.entities;

    const patient = Array.isArray(caseData.patient)
      ? (caseData.patient[0] ?? null)
      : (caseData.patient ?? null);

    return {
      case: caseData,
      entities,
      patient,
      metadata,
    };
  },

  /**
   * Schedule the discharge call linked to the case
   */
  async scheduleDischargeCall(
    supabase: SupabaseClientType,
    userId: string,
    caseId: string,
    options: CaseScheduleOptions,
  ): Promise<ScheduledDischargeCall> {
    // 1. Fetch Case Data to build variables
    const caseInfo = await this.getCaseWithEntities(supabase, caseId);
    if (!caseInfo) throw new Error("Case not found");

    const entities = caseInfo.entities;
    if (!entities) throw new Error("Case has no entities");

    // 2. Build Dynamic Variables
    const variablesResult = buildDynamicVariables({
      baseVariables: {
        clinicName: options.clinicName ?? "Your Clinic",
        agentName: "Sarah",
        petName: entities.patient.name,
        ownerName: entities.patient.owner.name,
        appointmentDate: "today",
        callType: "discharge",
        clinicPhone: options.clinicPhone ?? "",
        emergencyPhone: options.emergencyPhone ?? options.clinicPhone ?? "",
        dischargeSummary: options.summaryContent ??
          generateSummaryFromEntities(entities),

        medications: entities.clinical.medications
          ?.map((m) => `${m.name} ${m.dosage ?? ""} ${m.frequency ?? ""}`)
          .join(", "),
        nextSteps: entities.clinical.followUpInstructions,
      },
      strict: false,
      useDefaults: true,
    });

    // 3. Insert Scheduled Call
    const scheduledAt = options.scheduledAt ?? new Date();

    const assistantId = options.assistantId ?? env.VAPI_ASSISTANT_ID;
    const phoneNumberId = options.phoneNumberId ?? env.VAPI_PHONE_NUMBER_ID;

    const customerPhone = entities.patient.owner.phone ?? "";
    if (!customerPhone) {
      throw new Error("Patient phone number is required to schedule call");
    }

    const scheduledCallInsert = {
      user_id: userId,
      case_id: caseId,
      assistant_id: assistantId ?? "",
      phone_number_id: phoneNumberId ?? "",
      customer_phone: customerPhone,
      scheduled_for: scheduledAt.toISOString(),
      status: "queued" as const,
      dynamic_variables: variablesResult.variables,
      metadata: {
        notes: options.notes,
        retry_count: 0,
        max_retries: 3,
      } as ScheduledCallMetadata,
    };

    const { data: scheduledCall, error } = await supabase
      .from("scheduled_discharge_calls")
      .insert(scheduledCallInsert)
      .select()
      .single();

    if (error || !scheduledCall) {
      throw new Error(
        `Failed to schedule call: ${error?.message ?? "Unknown error"}`,
      );
    }

    // 4. Trigger QStash
    const qstashMessageId = await scheduleCallExecution(
      scheduledCall.id,
      scheduledAt,
    );

    // Update with QStash ID
    const updatedMetadata: ScheduledCallMetadata = {
      ...(scheduledCall.metadata as ScheduledCallMetadata),
      qstash_message_id: qstashMessageId,
    };

    const { error: updateError } = await supabase
      .from("scheduled_discharge_calls")
      .update({
        metadata: updatedMetadata,
      })
      .eq("id", scheduledCall.id);

    if (updateError) {
      console.error(
        "[CasesService] Error updating QStash message ID:",
        updateError,
      );
      // Don't throw - call was scheduled successfully
    }

    return scheduledCall as ScheduledDischargeCall;
  },

  /**
   * Merge logic for entities
   */
  mergeEntities(
    current: NormalizedEntities | undefined,
    incoming: NormalizedEntities,
  ): NormalizedEntities {
    if (!current) return incoming;
    return incoming;
  },
};

// --- Helpers ---

function mapCaseTypeToDb(
  type: string,
): Database["public"]["Enums"]["CaseType"] {
  // DB: "checkup" | "emergency" | "surgery" | "follow_up"
  const map: Record<string, Database["public"]["Enums"]["CaseType"]> = {
    checkup: "checkup",
    vaccination: "checkup",
    consultation: "checkup",
    emergency: "emergency",
    surgery: "surgery",
    dental: "surgery",
    follow_up: "follow_up",
    diagnostic: "follow_up",
    other: "follow_up",
    unknown: "checkup",
  };
  return map[type] ?? "checkup";
}

function mapIdexxToEntities(data: Record<string, unknown>): NormalizedEntities {
  const petName = typeof data.pet_name === "string" ? data.pet_name : "Unknown";

  // Map to valid species enum values
  const validSpecies = [
    "dog",
    "cat",
    "bird",
    "rabbit",
    "other",
    "unknown",
  ] as const;
  type ValidSpecies = (typeof validSpecies)[number];
  const rawSpecies = typeof data.species === "string"
    ? data.species.toLowerCase()
    : "unknown";
  const species: ValidSpecies = validSpecies.includes(
      rawSpecies as ValidSpecies,
    )
    ? (rawSpecies as ValidSpecies)
    : "unknown";

  const clientFirstName = typeof data.client_first_name === "string"
    ? data.client_first_name
    : "";
  const clientLastName = typeof data.client_last_name === "string"
    ? data.client_last_name
    : "";
  const ownerName = typeof data.owner_name === "string"
    ? data.owner_name
    : "Unknown";
  const phone = typeof data.phone_number === "string"
    ? data.phone_number
    : typeof data.mobile_number === "string"
    ? data.mobile_number
    : undefined;
  const email = typeof data.email === "string" ? data.email : undefined;

  return {
    patient: {
      name: petName,
      species: species,
      owner: {
        name: clientFirstName && clientLastName
          ? `${clientFirstName} ${clientLastName}`
          : ownerName,
        phone: phone,
        email: email,
      },
    },
    clinical: {
      medications: [],
      diagnoses: [],
    },
    caseType: "checkup",
    confidence: { overall: 0.5, patient: 0.5, clinical: 0.5 },
    extractedAt: new Date().toISOString(),
  };
}

function parseWeight(weightStr?: string): number | null {
  if (!weightStr) return null;
  const num = parseFloat(weightStr);
  return isNaN(num) ? null : num;
}

function generateSummaryFromEntities(entities: NormalizedEntities): string {
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

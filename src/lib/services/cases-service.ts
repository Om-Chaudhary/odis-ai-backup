import { type NormalizedEntities } from "~/lib/validators/scribe";
import { extractEntitiesWithRetry } from "~/lib/ai/normalize-scribe";
import { scheduleCallExecution } from "~/lib/qstash/client";
import { buildDynamicVariables } from "~/lib/vapi/knowledge-base";
import { extractVapiVariablesFromEntities } from "~/lib/vapi/extract-variables";
import { normalizeVariablesToSnakeCase } from "~/lib/vapi/utils";
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
  ): Promise<{
    case: CaseRow;
    entities: NormalizedEntities | undefined;
    patient: PatientRow | PatientRow[] | null;
    soapNotes: Database["public"]["Tables"]["soap_notes"]["Row"][] | null;
    dischargeSummaries:
      | Database["public"]["Tables"]["discharge_summaries"]["Row"][]
      | null;
    metadata: CaseMetadata;
  } | null> {
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

    const metadata = (caseData.metadata as CaseMetadata | undefined) ?? {};
    const entities = metadata.entities;

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
    let caseInfo = await this.getCaseWithEntities(supabase, caseId);
    if (!caseInfo) throw new Error("Case not found");

    let entities = caseInfo.entities;

    // 1a. Enrich entities with database values (database takes priority)
    if (entities && caseInfo.patient) {
      // Handle both single patient and array of patients
      const patient = Array.isArray(caseInfo.patient)
        ? caseInfo.patient[0]
        : caseInfo.patient;

      if (patient) {
        // Enrich patient demographics from database
        if (patient.species)
          entities.patient.species =
            patient.species as NormalizedEntities["patient"]["species"];
        if (patient.breed) entities.patient.breed = patient.breed;
        if (patient.sex)
          entities.patient.sex =
            patient.sex as NormalizedEntities["patient"]["sex"];
        if (patient.weight_kg)
          entities.patient.weight = `${patient.weight_kg} kg`;

        // Enrich owner information from database
        if (patient.owner_name)
          entities.patient.owner.name = patient.owner_name;
        if (patient.owner_phone)
          entities.patient.owner.phone = patient.owner_phone;
        if (patient.owner_email)
          entities.patient.owner.email = patient.owner_email;

        console.log(
          "[CasesService] Enriched entities with patient database values",
          {
            caseId,
            enrichedFields: {
              species: patient.species,
              breed: patient.breed,
              sex: patient.sex,
              weight: patient.weight_kg,
              ownerName: patient.owner_name,
              ownerPhone: patient.owner_phone,
            },
          },
        );
      }
    }

    // 1b. Enrich with client instructions from SOAP notes or discharge summaries
    if (entities) {
      let clientInstructions: string | null = null;

      // Priority 1: SOAP notes client_instructions
      if (caseInfo.soapNotes && caseInfo.soapNotes.length > 0) {
        const latestSoapNote = caseInfo.soapNotes[0];
        if (latestSoapNote?.client_instructions) {
          clientInstructions = latestSoapNote.client_instructions;
          console.log(
            "[CasesService] Using client instructions from SOAP notes",
            {
              caseId,
              source: "soap_notes.client_instructions",
              preview: clientInstructions.substring(0, 100),
            },
          );
        } else if (latestSoapNote?.plan) {
          // Priority 2: SOAP notes plan
          clientInstructions = latestSoapNote.plan;
          console.log("[CasesService] Using plan from SOAP notes", {
            caseId,
            source: "soap_notes.plan",
            preview: clientInstructions.substring(0, 100),
          });
        }
      }

      // Priority 3: Discharge summaries content
      if (
        !clientInstructions &&
        caseInfo.dischargeSummaries &&
        caseInfo.dischargeSummaries.length > 0
      ) {
        const latestDischargeSummary = caseInfo.dischargeSummaries[0];
        if (latestDischargeSummary?.content) {
          clientInstructions = latestDischargeSummary.content;
          console.log("[CasesService] Using discharge summary content", {
            caseId,
            source: "discharge_summaries.content",
            preview: clientInstructions.substring(0, 100),
          });
        }
      }

      // Add to entities if found
      if (clientInstructions) {
        entities.clinical.followUpInstructions = clientInstructions;
        console.log(
          "[CasesService] Enriched entities with client instructions",
          {
            caseId,
            instructionsLength: clientInstructions.length,
          },
        );
      }
    }

    // 2. Fallback: If entities are missing or incomplete, try extracting from transcription
    if (!entities || this.isEntitiesIncomplete(entities)) {
      console.log(
        "[CasesService] Entities missing or incomplete, attempting extraction from transcription",
        {
          caseId,
          hasEntities: !!entities,
          missingFields: entities
            ? this.getMissingEntityFields(entities)
            : ["all"],
        },
      );

      // Fetch transcription text
      const { data: transcriptionData } = await supabase
        .from("transcriptions")
        .select("transcript")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transcriptionData?.transcript) {
        try {
          // Extract entities from transcription
          const extractedEntities = await extractEntitiesWithRetry(
            transcriptionData.transcript,
            "transcript",
          );

          // Merge with existing entities (if any), with extracted taking precedence
          entities = entities
            ? this.mergeEntitiesForExtraction(entities, extractedEntities)
            : extractedEntities;

          // Update case metadata with enriched entities
          const updatedMetadata: CaseMetadata = {
            ...caseInfo.metadata,
            entities,
          };

          await supabase
            .from("cases")
            .update({ metadata: updatedMetadata })
            .eq("id", caseId);

          console.log(
            "[CasesService] Successfully extracted and merged entities from transcription",
            {
              caseId,
              extractedFields: this.getExtractedFields(extractedEntities),
            },
          );

          // Refresh case info with updated entities
          caseInfo = await this.getCaseWithEntities(supabase, caseId);
          if (!caseInfo) throw new Error("Case not found after update");
          entities = caseInfo.entities;
        } catch (extractionError) {
          console.error(
            "[CasesService] Failed to extract entities from transcription",
            {
              caseId,
              error: extractionError,
            },
          );
          // Continue with existing entities (or throw if none)
          if (!entities) {
            throw new Error(
              "Case has no entities and extraction from transcription failed",
            );
          }
        }
      } else {
        // No transcription available
        if (!entities) {
          throw new Error(
            "Case has no entities and no transcription available for extraction",
          );
        }
        console.warn(
          "[CasesService] Entities incomplete but no transcription found",
          {
            caseId,
            missingFields: this.getMissingEntityFields(entities),
          },
        );
      }
    }

    if (!entities) throw new Error("Case has no entities");

    // 2. Extract AI-extracted variables (species, breed, age, diagnoses, etc.)
    const extractedVars = extractVapiVariablesFromEntities(entities);

    // 3. Build Dynamic Variables with knowledge base integration
    const variablesResult = buildDynamicVariables({
      baseVariables: {
        clinicName: options.clinicName ?? "Your Clinic",
        agentName: options.agentName ?? "Sarah",
        petName: entities.patient.name,
        ownerName: entities.patient.owner.name,
        appointmentDate: "today",
        callType: "discharge",
        clinicPhone: options.clinicPhone ?? "",
        emergencyPhone: options.emergencyPhone ?? options.clinicPhone ?? "",
        dischargeSummary:
          options.summaryContent ?? generateSummaryFromEntities(entities),

        medications: entities.clinical.medications
          ?.map((m) => `${m.name} ${m.dosage ?? ""} ${m.frequency ?? ""}`)
          .join(", "),
        nextSteps: entities.clinical.followUpInstructions,

        // Include species/breed/age if available from entities
        // Note: petSpecies is limited to "dog" | "cat" | "other" for buildDynamicVariables
        // but extractedVars will include full patient_species (dog, cat, bird, rabbit, etc.)
        petSpecies:
          entities.patient.species === "dog" ||
          entities.patient.species === "cat"
            ? entities.patient.species
            : entities.patient.species
              ? "other"
              : undefined,
        petAge: entities.patient.age
          ? (() => {
              const num = parseFloat(
                entities.patient.age.replace(/[^0-9.]/g, ""),
              );
              return isNaN(num) ? undefined : num;
            })()
          : undefined,
        petWeight: entities.patient.weight
          ? (() => {
              const num = parseFloat(
                entities.patient.weight.replace(/[^0-9.]/g, ""),
              );
              return isNaN(num) ? undefined : num;
            })()
          : undefined,
      },
      strict: false,
      useDefaults: true,
    });

    // 4. Merge extracted variables with buildDynamicVariables result
    // Extracted vars (snake_case) are merged first, then buildDynamicVariables vars (camelCase)
    // are normalized and merged, with manual vars taking precedence
    const mergedVariables = {
      ...extractedVars, // Already snake_case (patient_species, patient_breed, etc.)
      ...normalizeVariablesToSnakeCase(
        variablesResult.variables as unknown as Record<string, unknown>,
      ), // Convert camelCase to snake_case
    };

    // 3. Insert Scheduled Call
    const assistantId = options.assistantId ?? env.VAPI_ASSISTANT_ID;
    const phoneNumberId = options.phoneNumberId ?? env.VAPI_PHONE_NUMBER_ID;

    // Get customer phone (with test mode support)
    let customerPhone = entities.patient.owner.phone ?? "";

    // Check if test mode is enabled
    const { data: userSettings } = await supabase
      .from("users")
      .select("test_mode_enabled, test_contact_phone, test_contact_name")
      .eq("id", userId)
      .single();

    const testModeEnabled = userSettings?.test_mode_enabled ?? false;

    if (testModeEnabled) {
      if (!userSettings?.test_contact_phone) {
        throw new Error(
          "Test mode is enabled but test contact phone is not configured",
        );
      }

      console.log(
        "[CasesService] Test mode enabled - redirecting call to test contact",
        {
          originalPhone: customerPhone,
          testPhone: userSettings.test_contact_phone,
          testContactName: userSettings.test_contact_name,
        },
      );

      customerPhone = userSettings.test_contact_phone;
    } else if (!customerPhone) {
      throw new Error("Patient phone number is required to schedule call");
    }

    // Determine scheduled time
    // In test mode, schedule for 1 minute from now
    // Otherwise, use provided time or default to immediate
    let scheduledAt: Date;
    if (testModeEnabled) {
      scheduledAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
      console.log(
        "[CasesService] Test mode enabled - scheduling for 1 minute from now",
        {
          scheduledAt: scheduledAt.toISOString(),
        },
      );
    } else {
      scheduledAt = options.scheduledAt ?? new Date(Date.now() + 60 * 2000);
    }

    // Check if a call already exists for this case
    // If it exists, update it instead of creating a new one to persist status
    const { data: existingCall } = await supabase
      .from("scheduled_discharge_calls")
      .select("id, status, vapi_call_id, scheduled_for")
      .eq("case_id", caseId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let scheduledCall: ScheduledDischargeCall;

    if (existingCall) {
      // Update existing call - preserve status if call is already in progress/completed
      // Only update to "queued" if status is null or if explicitly resetting
      const currentStatus = existingCall.status;
      const shouldPreserveStatus =
        currentStatus &&
        (currentStatus === "in_progress" ||
          currentStatus === "ringing" ||
          currentStatus === "completed");

      const updateData = {
        assistant_id: assistantId ?? "",
        phone_number_id: phoneNumberId ?? "",
        customer_phone: customerPhone,
        scheduled_for: scheduledAt.toISOString(),
        status: shouldPreserveStatus
          ? (currentStatus as
              | "queued"
              | "in_progress"
              | "ringing"
              | "completed"
              | "failed"
              | "canceled")
          : ("queued" as const),
        dynamic_variables: mergedVariables,
        metadata: {
          notes: options.notes,
          retry_count: 0,
          max_retries: 3,
        } as ScheduledCallMetadata,
      };

      const { data: updatedCall, error: updateError } = await supabase
        .from("scheduled_discharge_calls")
        .update(updateData)
        .eq("id", existingCall.id)
        .select()
        .single();

      if (updateError || !updatedCall) {
        throw new Error(
          `Failed to update existing call: ${updateError?.message ?? "Unknown error"}`,
        );
      }

      scheduledCall = updatedCall as ScheduledDischargeCall;

      console.log("[CasesService] Updated existing call for case", {
        caseId,
        callId: scheduledCall.id,
        preservedStatus: shouldPreserveStatus,
        status: scheduledCall.status,
      });

      // If updating an existing call, only reschedule QStash if the scheduled time changed
      // or if there's no existing QStash message ID
      const existingMetadata = scheduledCall.metadata;
      const hasExistingQStashId = !!existingMetadata?.qstash_message_id;
      const scheduledTimeChanged =
        existingCall.scheduled_for !== scheduledAt.toISOString();

      if (!hasExistingQStashId || scheduledTimeChanged) {
        // Reschedule QStash for the updated time
        const qstashMessageId = await scheduleCallExecution(
          scheduledCall.id,
          scheduledAt,
        );

        const updatedMetadata: ScheduledCallMetadata = {
          ...existingMetadata,
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
          // Don't throw - call was updated successfully
        }
      }
    } else {
      // Create new call
      const scheduledCallInsert = {
        user_id: userId,
        case_id: caseId,
        assistant_id: assistantId ?? "",
        phone_number_id: phoneNumberId ?? "",
        customer_phone: customerPhone,
        scheduled_for: scheduledAt.toISOString(),
        status: "queued" as const,
        dynamic_variables: mergedVariables, // Use merged variables with AI-extracted data
        metadata: {
          notes: options.notes,
          retry_count: 0,
          max_retries: 3,
        } as ScheduledCallMetadata,
      };

      const { data: newCall, error } = await supabase
        .from("scheduled_discharge_calls")
        .insert(scheduledCallInsert)
        .select()
        .single();

      if (error || !newCall) {
        throw new Error(
          `Failed to schedule call: ${error?.message ?? "Unknown error"}`,
        );
      }

      scheduledCall = newCall as ScheduledDischargeCall;

      // 4. Trigger QStash for new call
      const qstashMessageId = await scheduleCallExecution(
        scheduledCall.id,
        scheduledAt,
      );

      // Update with QStash ID
      const updatedMetadata: ScheduledCallMetadata = {
        ...(scheduledCall.metadata ?? {}),
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
    }

    return scheduledCall;
  },

  /**
   * Check if entities are incomplete (missing critical fields like species, breed, age)
   */
  isEntitiesIncomplete(entities: NormalizedEntities): boolean {
    const missingFields = this.getMissingEntityFields(entities);
    // Consider incomplete if missing species, breed, age, or weight
    return (
      missingFields.includes("species") ||
      missingFields.includes("breed") ||
      missingFields.includes("age") ||
      missingFields.includes("weight")
    );
  },

  /**
   * Get list of missing entity fields
   */
  getMissingEntityFields(entities: NormalizedEntities): string[] {
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
  },

  /**
   * Get list of successfully extracted fields (for logging)
   */
  getExtractedFields(entities: NormalizedEntities): string[] {
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
  },

  /**
   * Merge two entity sets, with extractedEntities taking precedence for missing fields
   * Used when re-extracting from transcription to fill in missing data
   */
  mergeEntitiesForExtraction(
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
          existing.clinical.recheckRequired ??
          extracted.clinical.recheckRequired,
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
  },

  /**
   * Merge logic for entities (used during case creation/update)
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
  const rawSpecies =
    typeof data.species === "string" ? data.species.toLowerCase() : "unknown";
  const species: ValidSpecies = validSpecies.includes(
    rawSpecies as ValidSpecies,
  )
    ? (rawSpecies as ValidSpecies)
    : "unknown";

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

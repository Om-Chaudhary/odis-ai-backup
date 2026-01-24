/**
 * Call Scheduling Functions
 *
 * Handles scheduling discharge calls with VAPI, QStash, and test mode support.
 */

import type { Database } from "@odis-ai/data-access/db";
import type { Json, SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { AIGeneratedCallIntelligence } from "@odis-ai/integrations/vapi/types";
import type { CaseMetadata } from "@odis-ai/shared/types/case";
import type {
  CaseScheduleOptions,
  ScheduledCallMetadata,
  ScheduledDischargeCall,
} from "@odis-ai/shared/types/services";
import type { ICallExecutor } from "@odis-ai/domain/shared";
import type { NormalizedEntities } from "@odis-ai/shared/validators";

import { normalizeToE164 } from "@odis-ai/shared/util/phone";
import { getClinicVapiConfigByUserId } from "@odis-ai/domain/clinics/vapi-config";

import { getCaseWithEntities } from "./case-crud";
import { generateSummaryFromEntities } from "./case-helpers";
import {
  isEntitiesIncomplete,
  getMissingEntityFields,
  enrichEntitiesWithPatient,
  getExtractedFields,
  mergeEntitiesForExtraction,
} from "./entity-utils";

type ScheduledCallRow =
  Database["public"]["Tables"]["scheduled_discharge_calls"]["Row"];
type ScheduledCallInsert =
  Database["public"]["Tables"]["scheduled_discharge_calls"]["Insert"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

/**
 * Extract client instructions with priority order:
 * 1. SOAP notes client_instructions
 * 2. SOAP notes plan
 * 3. Discharge summary content
 */
function getClientInstructions(
  caseInfo: {
    soapNotes: Database["public"]["Tables"]["soap_notes"]["Row"][] | null;
    dischargeSummaries:
      | Database["public"]["Tables"]["discharge_summaries"]["Row"][]
      | null;
  },
  caseId: string,
): string | null {
  const latestSoapNote = caseInfo.soapNotes?.[0];
  if (latestSoapNote?.client_instructions) {
    console.log("[CallScheduling] Using client instructions from SOAP notes", {
      caseId,
      source: "soap_notes.client_instructions",
      preview: latestSoapNote.client_instructions.substring(0, 100),
    });
    return latestSoapNote.client_instructions;
  }

  if (latestSoapNote?.plan) {
    console.log("[CallScheduling] Using plan from SOAP notes", {
      caseId,
      source: "soap_notes.plan",
      preview: latestSoapNote.plan.substring(0, 100),
    });
    return latestSoapNote.plan;
  }

  const latestDischargeSummary = caseInfo.dischargeSummaries?.[0];
  if (latestDischargeSummary?.content) {
    console.log("[CallScheduling] Using discharge summary content", {
      caseId,
      source: "discharge_summaries.content",
      preview: latestDischargeSummary.content.substring(0, 100),
    });
    return latestDischargeSummary.content;
  }

  return null;
}

/**
 * Determine when to schedule the call
 */
function determineScheduledTime(
  optionsScheduledAt: Date | undefined,
  defaultScheduleDelayMinutes: number | null | undefined,
  testModeEnabled: boolean,
  serverNow: Date,
): Date {
  if (optionsScheduledAt) {
    if (optionsScheduledAt <= serverNow) {
      throw new Error(
        `Scheduled time must be in the future. Provided: ${optionsScheduledAt.toISOString()}, Server now: ${serverNow.toISOString()}`,
      );
    }
    return optionsScheduledAt;
  }

  const delayMinutes = defaultScheduleDelayMinutes ?? (testModeEnabled ? 1 : 2);

  if (
    defaultScheduleDelayMinutes !== null &&
    defaultScheduleDelayMinutes !== undefined
  ) {
    console.log("[CallScheduling] Using user override for schedule delay", {
      delayMinutes,
      serverNow: serverNow.toISOString(),
    });
  }

  const scheduledAt = new Date(serverNow.getTime() + delayMinutes * 60 * 1000);
  console.log("[CallScheduling] Scheduling call", {
    delayMinutes,
    testModeEnabled,
    serverNow: serverNow.toISOString(),
    scheduledAt: scheduledAt.toISOString(),
  });

  return scheduledAt;
}

/**
 * Get pre-generated AI intelligence or generate new
 */
async function getOrGenerateCallIntelligence(
  caseId: string,
  metadata: CaseMetadata,
  entities: NormalizedEntities,
): Promise<AIGeneratedCallIntelligence | null> {
  const preGenerated = metadata.callIntelligence;

  if (preGenerated) {
    console.log(
      "[CallScheduling] Using pre-generated call intelligence from ingest",
      {
        caseId,
        generatedAt: preGenerated.generatedAt,
        questionCount: preGenerated.assessmentQuestions?.length ?? 0,
        callApproach: preGenerated.callApproach,
        confidence: preGenerated.confidence,
      },
    );
    return preGenerated;
  }

  console.log(
    "[CallScheduling] Generating AI call intelligence at schedule-time",
    {
      caseId,
      petName: entities.patient.name,
      diagnosis: entities.clinical.diagnoses?.[0],
    },
  );

  const { generateCallIntelligenceFromEntities } =
    await import("@odis-ai/integrations/ai/generate-assessment-questions");
  const intelligence = await generateCallIntelligenceFromEntities(entities);

  console.log("[CallScheduling] AI call intelligence generated", {
    caseId,
    questionCount: intelligence.assessmentQuestions?.length ?? 0,
    callApproach: intelligence.callApproach,
    shouldAskQuestions: intelligence.shouldAskClinicalQuestions,
    confidence: intelligence.confidence,
  });

  return intelligence;
}

/**
 * Build update data for existing scheduled call
 * Preserves status if call is already in progress or completed
 */
function buildUpdateData(
  currentStatus: string | null,
  assistantId: string | null | undefined,
  phoneNumberId: string | null | undefined,
  customerPhone: string,
  userId: string,
  scheduledAt: Date,
  dynamicVariables: Record<string, unknown>,
  notes: string | undefined,
): Partial<ScheduledCallRow> {
  const activeStatuses = ["in_progress", "ringing", "completed"];
  const shouldPreserveStatus =
    currentStatus && activeStatuses.includes(currentStatus);

  return {
    assistant_id: assistantId ?? "",
    outbound_phone_number_id: phoneNumberId ?? "",
    customer_phone: customerPhone,
    user_id: userId,
    scheduled_for: scheduledAt.toISOString(),
    status: shouldPreserveStatus
      ? (currentStatus as
          | "queued"
          | "in_progress"
          | "ringing"
          | "completed"
          | "failed"
          | "canceled")
      : "queued",
    dynamic_variables: dynamicVariables as Json,
    metadata: {
      notes,
      retry_count: 0,
      max_retries: 3,
    } as Json,
  };
}

/**
 * Schedule the discharge call linked to a case
 */
export async function scheduleDischargeCall(
  supabase: SupabaseClientType,
  userId: string,
  caseId: string,
  options: CaseScheduleOptions,
  callExecutor?: ICallExecutor,
): Promise<ScheduledDischargeCall> {
  // 1. Fetch Case Data to build variables
  let caseInfo = await getCaseWithEntities(supabase, caseId);
  if (!caseInfo) throw new Error("Case not found");

  let entities = caseInfo.entities;

  // 1a. Enrich entities with database values (database takes priority)
  enrichEntitiesWithPatient(entities, caseInfo.patient as PatientRow | null);

  // 1b. Enrich with client instructions from SOAP notes or discharge summaries
  if (entities) {
    const clientInstructions = getClientInstructions(caseInfo, caseId);
    if (clientInstructions) {
      entities.clinical.followUpInstructions = clientInstructions;
    }
  }

  // 2. Fallback: If entities are missing or incomplete, try extracting from transcription
  if (!entities || isEntitiesIncomplete(entities)) {
    console.log(
      "[CallScheduling] Entities missing or incomplete, attempting extraction from transcription",
      {
        caseId,
        hasEntities: !!entities,
        missingFields: entities ? getMissingEntityFields(entities) : ["all"],
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
        // Extract entities from transcription (dynamic import to avoid lazy-load constraint)
        const { extractEntitiesWithRetry } =
          await import("@odis-ai/integrations/ai/normalize-scribe");
        const extractedEntities = await extractEntitiesWithRetry(
          transcriptionData.transcript,
          "transcript",
        );

        // Merge with existing entities (if any), with extracted taking precedence
        entities = entities
          ? mergeEntitiesForExtraction(entities, extractedEntities)
          : extractedEntities;

        // Update case metadata with enriched entities
        const updatedMetadata: CaseMetadata = {
          ...caseInfo.metadata,
          entities,
        };

        await supabase
          .from("cases")
          .update({ metadata: updatedMetadata as Json })
          .eq("id", caseId);

        console.log(
          "[CallScheduling] Successfully extracted and merged entities from transcription",
          {
            caseId,
            extractedFields: getExtractedFields(extractedEntities),
          },
        );

        // Refresh case info with updated entities
        caseInfo = await getCaseWithEntities(supabase, caseId);
        if (!caseInfo) throw new Error("Case not found after update");
        entities = caseInfo.entities;

        // Re-apply database enrichment after re-fetch
        enrichEntitiesWithPatient(
          entities,
          caseInfo.patient as PatientRow | null,
        );
      } catch (extractionError) {
        console.error(
          "[CallScheduling] Failed to extract entities from transcription",
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
        "[CallScheduling] Entities incomplete but no transcription found",
        {
          caseId,
          missingFields: getMissingEntityFields(entities),
        },
      );
    }
  }

  if (!entities) throw new Error("Case has no entities");

  // 2. Extract AI-extracted variables (species, breed, age, diagnoses, etc.)
  // Dynamic import to avoid lazy-load constraint
  const { extractVapiVariablesFromEntities } =
    await import("@odis-ai/integrations/vapi/extract-variables");
  const extractedVars = extractVapiVariablesFromEntities(entities);

  // 2a. Get or generate AI call intelligence
  const aiIntelligence = await getOrGenerateCallIntelligence(
    caseId,
    caseInfo!.metadata,
    entities,
  );

  // 3. Build Dynamic Variables with knowledge base integration
  // Dynamic imports to avoid lazy-load constraint
  const { buildDynamicVariables } =
    await import("@odis-ai/integrations/vapi/knowledge-base");
  const { extractFirstName, normalizeVariablesToSnakeCase } =
    await import("@odis-ai/integrations/vapi/utils");
  const variablesResult = buildDynamicVariables({
    baseVariables: {
      clinicName: options.clinicName ?? "Your Clinic",
      agentName: "Sarah",
      petName: extractFirstName(entities.patient.name),
      ownerName: entities.patient.owner.name,
      appointmentDate: "recent visit",
      callType: "discharge",
      clinicPhone: options.clinicPhone ?? "",
      emergencyPhone: options.emergencyPhone ?? options.clinicPhone ?? "",
      dischargeSummary:
        options.summaryContent ?? generateSummaryFromEntities(entities),

      medications: entities.clinical.medications
        ?.map((m) => `${m.name} ${m.dosage ?? ""} ${m.frequency ?? ""}`)
        .join(", "),
      vaccinations: entities.clinical.vaccinations
        ?.map((v) => v.name)
        .join(", "),
      nextSteps: entities.clinical.followUpInstructions,

      petSpecies:
        entities.patient.species === "dog" || entities.patient.species === "cat"
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
    useDefaults: false,
    aiGeneratedIntelligence: aiIntelligence ?? undefined,
  });

  // 4. Merge extracted variables with buildDynamicVariables result
  const mergedVariables = {
    ...extractedVars,
    ...normalizeVariablesToSnakeCase(
      variablesResult.variables as unknown as Record<string, unknown>,
    ),
  };

  // 3. Insert Scheduled Call
  const clinicVapiConfig = await getClinicVapiConfigByUserId(userId, supabase);
  const assistantId =
    options.assistantId ?? clinicVapiConfig.outboundAssistantId;
  const phoneNumberId = options.phoneNumberId ?? clinicVapiConfig.phoneNumberId;

  console.log("[CallScheduling] Using VAPI config", {
    source: clinicVapiConfig.source,
    clinicName: clinicVapiConfig.clinicName,
    hasAssistantId: !!assistantId,
    hasPhoneNumberId: !!phoneNumberId,
  });

  // Get customer phone (with test mode support)
  let customerPhone = entities.patient.owner.phone ?? "";

  // Check if test mode is enabled and get schedule override
  const { data: userSettings } = await supabase
    .from("users")
    .select(
      "test_mode_enabled, test_contact_phone, test_contact_name, default_schedule_delay_minutes",
    )
    .eq("id", userId)
    .single();

  const testModeEnabled = userSettings?.test_mode_enabled ?? false;
  const defaultScheduleDelayMinutes =
    userSettings?.default_schedule_delay_minutes;

  if (testModeEnabled) {
    if (!userSettings?.test_contact_phone) {
      throw new Error(
        "Test mode is enabled but test contact phone is not configured",
      );
    }

    console.log(
      "[CallScheduling] Test mode enabled - redirecting call to test contact",
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

  // Normalize phone number to E.164 format
  const normalizedPhone = normalizeToE164(customerPhone);
  if (!normalizedPhone) {
    throw new Error(`Invalid phone number format: ${customerPhone}`);
  }
  customerPhone = normalizedPhone;

  // Determine scheduled time
  const serverNow = new Date();
  let scheduledAt = determineScheduledTime(
    options.scheduledAt,
    defaultScheduleDelayMinutes,
    testModeEnabled,
    serverNow,
  );

  // Auto-stagger calls to prevent VAPI concurrency limit (10 calls max)
  const STAGGER_MINUTES = 2;
  const windowStart = new Date(scheduledAt.getTime() - 2.5 * 60 * 1000);
  const windowEnd = new Date(scheduledAt.getTime() + 2.5 * 60 * 1000);

  const { count: existingCallsInWindow } = await supabase
    .from("scheduled_discharge_calls")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "queued")
    .neq("case_id", caseId)
    .gte("scheduled_for", windowStart.toISOString())
    .lte("scheduled_for", windowEnd.toISOString());

  if (existingCallsInWindow && existingCallsInWindow > 0) {
    const staggerOffset = existingCallsInWindow * STAGGER_MINUTES * 60 * 1000;
    const originalScheduledAt = scheduledAt;
    scheduledAt = new Date(scheduledAt.getTime() + staggerOffset);

    console.log(
      "[CallScheduling] Auto-staggering call to prevent concurrency limit",
      {
        caseId,
        existingCallsInWindow,
        staggerMinutes: existingCallsInWindow * STAGGER_MINUTES,
        originalScheduledAt: originalScheduledAt.toISOString(),
        staggeredScheduledAt: scheduledAt.toISOString(),
      },
    );
  }

  // Check if a call already exists for this case
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
    const updateData = buildUpdateData(
      existingCall.status,
      assistantId,
      phoneNumberId,
      customerPhone,
      userId,
      scheduledAt,
      mergedVariables,
      options.notes,
    );

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

    console.log("[CallScheduling] Updated existing call for case", {
      caseId,
      callId: scheduledCall.id,
      status: scheduledCall.status,
    });

    // If updating an existing call, only reschedule QStash if the scheduled time changed
    const existingMetadata = scheduledCall.metadata;
    const hasExistingQStashId = !!existingMetadata?.qstash_message_id;
    const scheduledTimeChanged =
      existingCall.scheduled_for !== scheduledAt.toISOString();

    if (!hasExistingQStashId || scheduledTimeChanged) {
      if (testModeEnabled) {
        console.log(
          "[CallScheduling] Test mode enabled - executing call immediately",
          {
            callId: scheduledCall.id,
            testPhone: customerPhone,
          },
        );

        let result;
        if (callExecutor) {
          result = await callExecutor.executeScheduledCall(
            scheduledCall.id,
            supabase,
          );
        } else {
          const { executeScheduledCall } =
            // eslint-disable-next-line @nx/enforce-module-boundaries
            await import("@odis-ai/domain/discharge/call-executor");
          result = await executeScheduledCall(scheduledCall.id, supabase);
        }

        if (!result.success) {
          console.error(
            "[CallScheduling] Immediate call execution failed - call may not execute",
            {
              callId: scheduledCall.id,
              error: result.error,
            },
          );
        }
      } else {
        // Dynamic import to avoid lazy-load constraint
        const { scheduleCallExecution } =
          await import("@odis-ai/integrations/qstash/client");
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
            metadata: updatedMetadata as Json,
          })
          .eq("id", scheduledCall.id);

        if (updateError) {
          console.error(
            "[CallScheduling] Error updating QStash message ID:",
            updateError,
          );
        }
      }
    }
  } else {
    // Create new call
    const scheduledCallInsert: ScheduledCallInsert = {
      user_id: userId,
      case_id: caseId,
      assistant_id: assistantId ?? "",
      outbound_phone_number_id: phoneNumberId ?? "",
      customer_phone: customerPhone,
      scheduled_for: scheduledAt.toISOString(),
      status: "queued" as const,
      dynamic_variables: mergedVariables as Json,
      metadata: {
        notes: options.notes,
        retry_count: 0,
        max_retries: 3,
      } as Json,
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

    // 4. Execute immediately in test mode, otherwise trigger QStash for new call
    if (testModeEnabled) {
      console.log(
        "[CallScheduling] Test mode enabled - executing call immediately",
        {
          callId: scheduledCall.id,
          testPhone: customerPhone,
        },
      );

      let result;
      if (callExecutor) {
        result = await callExecutor.executeScheduledCall(
          scheduledCall.id,
          supabase,
        );
      } else {
        const { executeScheduledCall } =
          // eslint-disable-next-line @nx/enforce-module-boundaries
          await import("@odis-ai/domain/discharge/call-executor");
        result = await executeScheduledCall(scheduledCall.id, supabase);
      }

      if (!result.success) {
        console.error(
          "[CallScheduling] Immediate call execution failed - call may not execute",
          {
            callId: scheduledCall.id,
            error: result.error,
          },
        );
      }
    } else {
      // Dynamic import to avoid lazy-load constraint
      const { scheduleCallExecution } =
        await import("@odis-ai/integrations/qstash/client");
      const qstashMessageId = await scheduleCallExecution(
        scheduledCall.id,
        scheduledAt,
      );

      const updatedMetadata: ScheduledCallMetadata = {
        ...(scheduledCall.metadata ?? {}),
        qstash_message_id: qstashMessageId,
      };

      const { error: updateError } = await supabase
        .from("scheduled_discharge_calls")
        .update({
          metadata: updatedMetadata as Json,
        })
        .eq("id", scheduledCall.id);

      if (updateError) {
        console.error(
          "[CallScheduling] Error updating QStash message ID:",
          updateError,
        );
      }
    }
  }

  return scheduledCall;
}

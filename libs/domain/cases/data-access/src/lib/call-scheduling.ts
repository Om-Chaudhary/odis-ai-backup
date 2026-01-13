/**
 * Call Scheduling Functions
 *
 * Handles scheduling discharge calls with VAPI, QStash, and test mode support.
 */

import type { Database, Json } from "@odis-ai/shared/types";
import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { AIGeneratedCallIntelligence } from "@odis-ai/integrations/vapi/types";
import type { CaseMetadata } from "@odis-ai/shared/types/case";
import type {
  CaseScheduleOptions,
  ScheduledCallMetadata,
  ScheduledDischargeCall,
} from "@odis-ai/shared/types/services";
import type { ICallExecutor } from "@odis-ai/domain/shared";

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
    let clientInstructions: string | null = null;

    // Priority 1: SOAP notes client_instructions
    if (caseInfo.soapNotes && caseInfo.soapNotes.length > 0) {
      const latestSoapNote = caseInfo.soapNotes[0];
      if (latestSoapNote?.client_instructions) {
        clientInstructions = latestSoapNote.client_instructions;
        console.log(
          "[CallScheduling] Using client instructions from SOAP notes",
          {
            caseId,
            source: "soap_notes.client_instructions",
            preview: clientInstructions?.substring(0, 100) ?? "",
          },
        );
      } else if (latestSoapNote?.plan) {
        // Priority 2: SOAP notes plan
        clientInstructions = latestSoapNote.plan;
        console.log("[CallScheduling] Using plan from SOAP notes", {
          caseId,
          source: "soap_notes.plan",
          preview: clientInstructions?.substring(0, 100) ?? "",
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
        console.log("[CallScheduling] Using discharge summary content", {
          caseId,
          source: "discharge_summaries.content",
          preview: clientInstructions?.substring(0, 100) ?? "",
        });
      }
    }

    // Add to entities if found
    if (clientInstructions) {
      entities.clinical.followUpInstructions = clientInstructions;
      console.log(
        "[CallScheduling] Enriched entities with client instructions",
        {
          caseId,
          instructionsLength: clientInstructions.length,
        },
      );
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

  // 2a. Check for pre-generated AI call intelligence (generated at ingest-time)
  let aiIntelligence: AIGeneratedCallIntelligence | null = null;
  const caseMeta = caseInfo?.metadata as CaseMetadata | null;
  const preGeneratedIntelligence = caseMeta?.callIntelligence;

  if (preGeneratedIntelligence) {
    console.log(
      "[CallScheduling] Using pre-generated call intelligence from ingest",
      {
        caseId,
        generatedAt: preGeneratedIntelligence.generatedAt,
        questionCount:
          preGeneratedIntelligence.assessmentQuestions?.length ?? 0,
        callApproach: preGeneratedIntelligence.callApproach,
        confidence: preGeneratedIntelligence.confidence,
      },
    );

    aiIntelligence = {
      caseContextSummary: preGeneratedIntelligence.caseContextSummary,
      assessmentQuestions: preGeneratedIntelligence.assessmentQuestions,
      warningSignsToMonitor: preGeneratedIntelligence.warningSignsToMonitor,
      normalExpectations: preGeneratedIntelligence.normalExpectations,
      emergencyCriteria: preGeneratedIntelligence.emergencyCriteria,
      shouldAskClinicalQuestions:
        preGeneratedIntelligence.shouldAskClinicalQuestions,
      callApproach: preGeneratedIntelligence.callApproach,
      confidence: preGeneratedIntelligence.confidence,
    };
  } else {
    // Generate AI call intelligence at schedule-time (for non-IDEXX cases or legacy data)
    console.log(
      "[CallScheduling] Generating AI call intelligence at schedule-time",
      {
        caseId,
        petName: entities.patient.name,
        diagnosis: entities.clinical.diagnoses?.[0],
      },
    );

    // Dynamic import to avoid lazy-load constraint
    const { generateCallIntelligenceFromEntities } =
      await import("@odis-ai/integrations/ai/generate-assessment-questions");
    const intelligence = await generateCallIntelligenceFromEntities(entities);
    aiIntelligence = {
      caseContextSummary: intelligence.caseContextSummary,
      assessmentQuestions: intelligence.assessmentQuestions,
      warningSignsToMonitor: intelligence.warningSignsToMonitor,
      normalExpectations: intelligence.normalExpectations,
      emergencyCriteria: intelligence.emergencyCriteria,
      shouldAskClinicalQuestions: intelligence.shouldAskClinicalQuestions,
      callApproach: intelligence.callApproach,
      confidence: intelligence.confidence,
    };

    console.log("[CallScheduling] AI call intelligence generated", {
      caseId,
      questionCount: intelligence.assessmentQuestions?.length ?? 0,
      callApproach: intelligence.callApproach,
      shouldAskQuestions: intelligence.shouldAskClinicalQuestions,
      confidence: intelligence.confidence,
    });
  }

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

  // Determine scheduled time using server time
  const serverNow = new Date();
  let scheduledAt: Date;

  if (options.scheduledAt) {
    if (options.scheduledAt <= serverNow) {
      throw new Error(
        `Scheduled time must be in the future. Provided: ${options.scheduledAt.toISOString()}, Server now: ${serverNow.toISOString()}`,
      );
    }
    scheduledAt = options.scheduledAt;
  } else {
    let delayMinutes: number;
    if (
      defaultScheduleDelayMinutes !== null &&
      defaultScheduleDelayMinutes !== undefined
    ) {
      delayMinutes = defaultScheduleDelayMinutes;
      console.log("[CallScheduling] Using user override for schedule delay", {
        delayMinutes,
        serverNow: serverNow.toISOString(),
      });
    } else if (testModeEnabled) {
      delayMinutes = 1;
    } else {
      delayMinutes = 2;
    }

    scheduledAt = new Date(serverNow.getTime() + delayMinutes * 60 * 1000);
    console.log("[CallScheduling] Scheduling call", {
      delayMinutes,
      testModeEnabled,
      serverNow: serverNow.toISOString(),
      scheduledAt: scheduledAt.toISOString(),
    });
  }

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
    // Update existing call - preserve status if call is already in progress/completed
    const currentStatus = existingCall.status;
    const shouldPreserveStatus =
      currentStatus &&
      (currentStatus === "in_progress" ||
        currentStatus === "ringing" ||
        currentStatus === "completed");

    const updateData: Partial<ScheduledCallRow> = {
      assistant_id: assistantId ?? "",
      phone_number_id: phoneNumberId ?? "",
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
        : ("queued" as const),
      dynamic_variables: mergedVariables as Json,
      metadata: {
        notes: options.notes,
        retry_count: 0,
        max_retries: 3,
      } as Json,
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

    console.log("[CallScheduling] Updated existing call for case", {
      caseId,
      callId: scheduledCall.id,
      preservedStatus: shouldPreserveStatus,
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
      phone_number_id: phoneNumberId ?? "",
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

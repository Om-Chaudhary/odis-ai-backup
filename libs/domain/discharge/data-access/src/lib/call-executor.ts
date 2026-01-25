/**
 * Call Executor
 *
 * Core execution logic for scheduled discharge calls.
 * Decoupled from HTTP handling to enable direct invocation in test mode
 * or via webhook in normal mode.
 *
 * Uses dynamic imports for vapi modules to avoid circular dependencies:
 * vapi -> qstash -> services-discharge cycle
 *
 * @module @odis-ai/domain/discharge/call-executor
 */

import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { Database } from "@odis-ai/shared/types";
import type { CallExecutionResult } from "@odis-ai/shared/types/services";
import type { ICallExecutor } from "@odis-ai/domain/shared";
import { isWithinBusinessHours } from "@odis-ai/shared/util/business-hours";

/* ========================================
   Types
   ======================================== */

type ScheduledCallRow =
  Database["public"]["Tables"]["scheduled_discharge_calls"]["Row"];

/* ========================================
   Main Executor Function
   ======================================== */

/**
 * Execute a scheduled discharge call
 *
 * This is the core execution logic, decoupled from HTTP handling.
 * Can be called directly (test mode) or via webhook (normal mode).
 *
 * @param callId - The scheduled call ID from the database
 * @param supabase - Supabase client instance
 * @returns Execution result with success status and call details
 */
export async function executeScheduledCall(
  callId: string,
  supabase: SupabaseClientType,
): Promise<CallExecutionResult> {
  console.log("[CALL_EXECUTOR] Starting execution", { callId });

  // Dynamic import vapi modules to avoid circular dependencies
  const { createPhoneCall, mapVapiStatus } =
    await import("@odis-ai/integrations/vapi");
  const { normalizeVariablesToSnakeCase } =
    await import("@odis-ai/integrations/vapi/utils");

  // 1. Fetch scheduled call from database
  const { data: call, error } = await supabase
    .from("scheduled_discharge_calls")
    .select("*")
    .eq("id", callId)
    .single();

  if (error || !call) {
    console.error("[CALL_EXECUTOR] Call not found", { callId, error });
    return { success: false, callId, error: "Scheduled call not found" };
  }

  // 2. Check status (prevent double execution)
  if (call.status !== "queued") {
    console.warn("[CALL_EXECUTOR] Call already processed", {
      callId,
      status: call.status,
    });
    return {
      success: true,
      callId,
      alreadyProcessed: true,
      status: call.status,
    };
  }

  // 3. Get metadata
  const metadata = call.metadata as Record<string, unknown> | null;

  // 4. Validate VAPI configuration
  const assistantId = call.assistant_id;
  const phoneNumberId = call.outbound_phone_number_id;
  const customerPhone = call.customer_phone;

  if (!assistantId) {
    console.error("[CALL_EXECUTOR] Missing assistant_id", { callId });
    return {
      success: false,
      callId,
      error: "Missing assistant_id configuration",
    };
  }

  if (!phoneNumberId) {
    console.error("[CALL_EXECUTOR] Missing outbound_phone_number_id", {
      callId,
    });
    return {
      success: false,
      callId,
      error: "Missing outbound_phone_number_id configuration",
    };
  }

  if (!customerPhone) {
    console.error("[CALL_EXECUTOR] Missing customer_phone", { callId });
    return { success: false, callId, error: "Missing customer phone number" };
  }

  // 5. Enrich variables with fresh case data
  const dynamicVariables = await enrichCallVariables(call, supabase);

  // 6. Normalize variables for VAPI
  const normalizedVariables = normalizeVariablesToSnakeCase(dynamicVariables);

  // 7. Add clinic open status
  const callTimezone = (metadata?.timezone as string) ?? "America/Los_Angeles";
  const isClinicOpen = isWithinBusinessHours(new Date(), callTimezone);
  normalizedVariables.clinic_is_open = isClinicOpen ? "true" : "false";

  console.log("[CALL_EXECUTOR] Clinic open status", {
    callId,
    timezone: callTimezone,
    isClinicOpen,
  });

  // 8. Build voicemail config
  const voicemailConfig = await buildVoicemailConfig(call.user_id, supabase);

  console.log("[CALL_EXECUTOR] Prepared for VAPI call", {
    callId,
    phoneNumber: customerPhone,
    assistantId,
    phoneNumberId,
    variableCount: Object.keys(normalizedVariables).length,
    criticalVariables: {
      pet_name: normalizedVariables.pet_name,
      owner_name: normalizedVariables.owner_name,
      clinic_name: normalizedVariables.clinic_name,
    },
  });

  // 9. Execute VAPI call
  try {
    const response = await createPhoneCall({
      phoneNumber: customerPhone,
      assistantId,
      phoneNumberId,
      assistantOverrides: {
        ...(Object.keys(normalizedVariables).length > 0 && {
          variableValues: normalizedVariables,
        }),
        ...voicemailConfig,
      },
    });

    console.log("[CALL_EXECUTOR] VAPI call initiated", {
      callId,
      vapiCallId: response.id,
      status: response.status,
    });

    // 10. Update database with success
    await supabase
      .from("scheduled_discharge_calls")
      .update({
        vapi_call_id: response.id,
        status: mapVapiStatus(response.status),
        started_at: response.startedAt ?? null,
        metadata: {
          ...metadata,
          executed_at: new Date().toISOString(),
          voicemail_detection_enabled:
            voicemailConfig.voicemailDetection !== "off",
        },
      })
      .eq("id", callId);

    // 11. Update auto-scheduled item status if applicable
    try {
      // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
      const { updateAutoScheduledItemStatus } = await import(
        "@odis-ai/domain/auto-scheduling"
      );
      await updateAutoScheduledItemStatus(supabase, {
        scheduledCallId: callId,
        status: "completed",
      });
    } catch (autoScheduleError) {
      // Log but don't fail - auto-scheduling tracking is optional
      console.warn("[CALL_EXECUTOR] Failed to update auto-scheduled item status", {
        callId,
        error:
          autoScheduleError instanceof Error
            ? autoScheduleError.message
            : String(autoScheduleError),
      });
    }

    return {
      success: true,
      callId,
      vapiCallId: response.id,
      status: response.status,
    };
  } catch (vapiError) {
    // VAPI call failed - update database with failure status
    const errorMessage =
      vapiError instanceof Error ? vapiError.message : String(vapiError);

    console.error("[CALL_EXECUTOR] VAPI call failed", {
      callId,
      error: errorMessage,
    });

    await supabase
      .from("scheduled_discharge_calls")
      .update({
        status: "failed",
        metadata: {
          ...metadata,
          executed_at: new Date().toISOString(),
          error: errorMessage,
          failed_at: new Date().toISOString(),
        },
      })
      .eq("id", callId);

    // Update auto-scheduled item status if applicable
    try {
      // eslint-disable-next-line @nx/enforce-module-boundaries -- Dynamic import avoids build-time circular dependency
      const { updateAutoScheduledItemStatus } = await import(
        "@odis-ai/domain/auto-scheduling"
      );
      await updateAutoScheduledItemStatus(supabase, {
        scheduledCallId: callId,
        status: "failed",
      });
    } catch (autoScheduleError) {
      // Log but don't fail - auto-scheduling tracking is optional
      console.warn("[CALL_EXECUTOR] Failed to update auto-scheduled item status", {
        callId,
        error:
          autoScheduleError instanceof Error
            ? autoScheduleError.message
            : String(autoScheduleError),
      });
    }

    return { success: false, callId, error: errorMessage };
  }
}

/* ========================================
   Helper Functions
   ======================================== */

/**
 * Enrich call variables with fresh case data
 *
 * Fetches the latest case data and merges it with stored variables
 * to ensure the call uses the most up-to-date information.
 */
async function enrichCallVariables(
  call: ScheduledCallRow,
  supabase: SupabaseClientType,
): Promise<Record<string, unknown>> {
  let dynamicVariables = call.dynamic_variables as Record<
    string,
    unknown
  > | null;

  console.log("[CALL_EXECUTOR] Initial variables from database", {
    callId: call.id,
    variableCount: dynamicVariables ? Object.keys(dynamicVariables).length : 0,
    sampleKeys: dynamicVariables
      ? Object.keys(dynamicVariables).slice(0, 5)
      : [],
  });

  // Skip enrichment if no case linked
  if (!call.case_id) {
    return dynamicVariables ?? {};
  }

  try {
    // Dynamic imports to avoid circular dependencies
    // eslint-disable-next-line @nx/enforce-module-boundaries
    const { CasesService } = await import("@odis-ai/domain/cases");
    const { buildDynamicVariables } =
      await import("@odis-ai/integrations/vapi/knowledge-base");
    const { extractVapiVariablesFromEntities } =
      await import("@odis-ai/integrations/vapi/extract-variables");
    const { normalizeVariablesToSnakeCase, extractFirstName } =
      await import("@odis-ai/integrations/vapi/utils");

    const caseInfo = await CasesService.getCaseWithEntities(
      supabase,
      call.case_id,
    );

    if (!caseInfo?.entities) {
      console.warn("[CALL_EXECUTOR] No entities found for case", {
        callId: call.id,
        caseId: call.case_id,
      });
      return dynamicVariables ?? {};
    }

    console.log("[CALL_EXECUTOR] Enriching with fresh case data", {
      callId: call.id,
      caseId: call.case_id,
      casePatientName: caseInfo.entities.patient.name,
      caseOwnerName: caseInfo.entities.patient.owner.name,
    });

    // Extract AI-extracted variables
    const extractedVars = extractVapiVariablesFromEntities(caseInfo.entities);

    // Build fresh variables from entities
    const freshVars = buildDynamicVariables({
      baseVariables: {
        clinicName: (dynamicVariables?.clinic_name as string) ?? "Your Clinic",
        agentName: "Sarah",
        petName:
          caseInfo.entities.patient.name &&
          caseInfo.entities.patient.name !== "unknown" &&
          caseInfo.entities.patient.name.trim() !== ""
            ? extractFirstName(caseInfo.entities.patient.name)
            : ((dynamicVariables?.pet_name as string | undefined) ?? "unknown"),
        ownerName:
          caseInfo.entities.patient.owner.name &&
          caseInfo.entities.patient.owner.name !== "unknown" &&
          caseInfo.entities.patient.owner.name.trim() !== ""
            ? caseInfo.entities.patient.owner.name
            : ((dynamicVariables?.owner_name as string | undefined) ??
              "unknown"),
        appointmentDate: (dynamicVariables?.appointment_date ??
          "today") as string,
        callType:
          (dynamicVariables?.call_type as
            | "discharge"
            | "follow-up"
            | undefined) ?? "discharge",
        clinicPhone: (dynamicVariables?.clinic_phone as string) ?? "",
        emergencyPhone: (dynamicVariables?.emergency_phone as string) ?? "",
        dischargeSummary:
          (dynamicVariables?.discharge_summary_content as string) ?? "",
        medications: caseInfo.entities.clinical.medications
          ?.map(
            (m: { name: string; dosage?: string; frequency?: string }) =>
              `${m.name} ${m.dosage ?? ""} ${m.frequency ?? ""}`,
          )
          .join(", "),
        vaccinations: caseInfo.entities.clinical.vaccinations
          ?.map((v: { name: string }) => v.name)
          .join(", "),
        nextSteps: caseInfo.entities.clinical.followUpInstructions,
        petSpecies:
          caseInfo.entities.patient.species === "dog" ||
          caseInfo.entities.patient.species === "cat"
            ? caseInfo.entities.patient.species
            : caseInfo.entities.patient.species
              ? "other"
              : undefined,
        petAge: caseInfo.entities.patient.age
          ? (() => {
              const num = parseFloat(
                caseInfo.entities.patient.age.replace(/[^0-9.]/g, ""),
              );
              return isNaN(num) ? undefined : num;
            })()
          : undefined,
        petWeight: caseInfo.entities.patient.weight
          ? (() => {
              const num = parseFloat(
                caseInfo.entities.patient.weight.replace(/[^0-9.]/g, ""),
              );
              return isNaN(num) ? undefined : num;
            })()
          : undefined,
      },
      strict: false,
      useDefaults: false,
    });

    // Merge: Extracted AI vars + Fresh Clinical Vars + Stored Vars (stored vars override)
    dynamicVariables = {
      ...extractedVars,
      ...normalizeVariablesToSnakeCase(
        freshVars.variables as unknown as Record<string, unknown>,
      ),
      ...dynamicVariables,
    };

    console.log("[CALL_EXECUTOR] Variables enriched", {
      callId: call.id,
      variableCount: Object.keys(dynamicVariables).length,
    });

    return dynamicVariables;
  } catch (enrichError) {
    console.error("[CALL_EXECUTOR] Failed to enrich with case data", {
      callId: call.id,
      error:
        enrichError instanceof Error
          ? enrichError.message
          : String(enrichError),
    });
    // Continue with stored variables on error
    return dynamicVariables ?? {};
  }
}

/**
 * Build voicemail detection config from user settings
 */
async function buildVoicemailConfig(
  userId: string,
  supabase: SupabaseClientType,
): Promise<Record<string, unknown>> {
  // Fetch user's voicemail detection settings
  const { data: userSettings } = await supabase
    .from("users")
    .select(
      "voicemail_detection_enabled, voicemail_hangup_on_detection, voicemail_message",
    )
    .eq("id", userId)
    .single();

  const voicemailDetectionEnabled =
    userSettings?.voicemail_detection_enabled ?? false;
  const voicemailHangupOnDetection =
    userSettings?.voicemail_hangup_on_detection ?? false;
  const customVoicemailMessage = userSettings?.voicemail_message ?? null;

  console.log("[CALL_EXECUTOR] Voicemail detection settings", {
    userId,
    voicemailDetectionEnabled,
    voicemailHangupOnDetection,
    hasCustomMessage: !!customVoicemailMessage,
  });

  if (!voicemailDetectionEnabled) {
    return { voicemailDetection: "off" as const };
  }

  // Default voicemail message template
  const defaultVoicemailMessage = `Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}. I'm calling to check in on {{pet_name}} after the recent visit. Everything looked great from our end. If you have any questions or concerns about {{pet_name}}, please give us a call at {{clinic_phone}}. Take care!`;

  const config: {
    voicemailDetection: {
      provider: "vapi";
      enabled: boolean;
    };
    voicemailMessage?: string;
  } = {
    voicemailDetection: {
      provider: "vapi",
      enabled: true,
    },
  };

  if (voicemailHangupOnDetection) {
    config.voicemailMessage = "";
  } else {
    config.voicemailMessage = customVoicemailMessage ?? defaultVoicemailMessage;
  }

  return config;
}

/**
 * CallExecutor object implementing ICallExecutor interface
 * Allows this module to be injected as a dependency
 */
export const CallExecutor: ICallExecutor = {
  executeScheduledCall,
};

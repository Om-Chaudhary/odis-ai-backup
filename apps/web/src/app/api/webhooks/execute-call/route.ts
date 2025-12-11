import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import { createServiceClient } from "@odis-ai/db/server";
import { createPhoneCall, mapVapiStatus } from "@odis-ai/vapi/client";
import { buildDynamicVariables } from "@odis-ai/vapi/knowledge-base";

// Dynamic import to avoid bundling @react-email/components during static generation
async function getCasesService() {
  const { CasesService } = await import("@odis-ai/services-cases");
  return CasesService;
}
import { extractVapiVariablesFromEntities } from "@odis-ai/vapi/extract-variables";
import {
  normalizeVariablesToSnakeCase,
  extractFirstName,
} from "@odis-ai/vapi/utils";
import { isWithinBusinessHours } from "@odis-ai/utils/business-hours";

/**
 * Execute Call Webhook
 *
 * POST /api/webhooks/execute-call
 *
 * This webhook is triggered by QStash at the scheduled time.
 * It executes the scheduled call via VAPI.
 *
 * Security: QStash signature verification is critical
 */

interface ExecuteCallPayload {
  callId: string;
}

/**
 * Handle execution of scheduled call
 */
async function handler(req: NextRequest) {
  try {
    console.log("[EXECUTE_CALL] Webhook triggered");

    // Parse request body
    const payload = (await req.json()) as ExecuteCallPayload;
    const { callId } = payload;

    if (!callId) {
      console.error("[EXECUTE_CALL] Missing callId in payload");
      return NextResponse.json(
        { error: "Missing callId in payload" },
        { status: 400 },
      );
    }

    console.log("[EXECUTE_CALL] Processing call", { callId });

    // Get Supabase service client (bypass RLS)
    const supabase = await createServiceClient();

    // Fetch scheduled call from database
    const { data: call, error } = await supabase
      .from("scheduled_discharge_calls")
      .select("*")
      .eq("id", callId)
      .single();

    if (error || !call) {
      console.error("[EXECUTE_CALL] Call not found", {
        callId,
        error,
      });
      return NextResponse.json(
        { error: "Scheduled call not found" },
        { status: 404 },
      );
    }

    // Check if call is still in queued status (prevent double execution)
    if (call.status !== "queued") {
      console.warn("[EXECUTE_CALL] Call already processed", {
        callId,
        status: call.status,
      });
      return NextResponse.json({
        success: true,
        message: "Call already processed",
        status: call.status,
      });
    }

    // Get metadata and stored variables
    const metadata = call.metadata as Record<string, unknown> | null;
    let dynamicVariables = call.dynamic_variables as Record<
      string,
      unknown
    > | null;

    console.log("[EXECUTE_CALL] Initial variables from database", {
      callId,
      variableCount: dynamicVariables
        ? Object.keys(dynamicVariables).length
        : 0,
      sampleKeys: dynamicVariables
        ? Object.keys(dynamicVariables).slice(0, 5)
        : [],
      format: "snake_case (from database)",
    });

    // --- ENRICHMENT: Fetch latest case data if linked ---
    if (call.case_id) {
      try {
        const CasesService = await getCasesService();
        const caseInfo = await CasesService.getCaseWithEntities(
          supabase,
          call.case_id,
        );
        if (caseInfo?.entities) {
          console.log("[EXECUTE_CALL] Enriching with fresh case data", {
            callId: call.case_id,
            casePatientName: caseInfo.entities.patient.name,
            caseOwnerName: caseInfo.entities.patient.owner.name,
            storedPetName: dynamicVariables?.pet_name,
            storedOwnerName: dynamicVariables?.owner_name,
          });

          // Extract AI-extracted variables (species, breed, age, diagnoses, etc.)
          const extractedVars = extractVapiVariablesFromEntities(
            caseInfo.entities,
          );

          // Re-generate variables from fresh entities
          // We treat the stored variables as "Defaults"/Context (like clinic name)
          // and overwrite clinical parts with fresh data.
          const freshVars = buildDynamicVariables({
            baseVariables: {
              // Use stored values as base if available, otherwise defaults
              clinicName:
                (dynamicVariables?.clinic_name as string) ?? "Your Clinic",
              agentName: (dynamicVariables?.agent_name as string) ?? "Sarah",
              // Fallback to stored pet_name if case entities have empty/unknown patient name
              // Use extractFirstName to get only the first word (many vet systems store "FirstName LastName")
              petName:
                caseInfo.entities.patient.name &&
                caseInfo.entities.patient.name !== "unknown" &&
                caseInfo.entities.patient.name.trim() !== ""
                  ? extractFirstName(caseInfo.entities.patient.name)
                  : ((dynamicVariables?.pet_name as string | undefined) ??
                    "unknown"),
              // Fallback to stored owner_name if case entities have empty/unknown owner name
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
              emergencyPhone:
                (dynamicVariables?.emergency_phone as string) ?? "",

              // Fresh Clinical Data overrides
              dischargeSummary:
                (dynamicVariables?.discharge_summary_content as string) ?? "", // Keep original summary or regenerate?
              // If we regenerate summary blindly we might lose specific instructions generated by the "Generate Summary" flow.
              // BUT, if the user updated the case entities (e.g. meds), we want that reflected.
              // The "discharge_summary_content" variable is usually the specific text.
              // The separate fields like "medications" are used by VAPI for structured questions.

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

              // Include species/breed/age if available from entities
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
            // Disable static knowledge base defaults - only use AI-generated intelligence
            useDefaults: false,
          });

          console.log(
            "[EXECUTE_CALL] Fresh variables from buildDynamicVariables",
            {
              callId,
              variableCount: Object.keys(freshVars.variables).length,
              sampleKeys: Object.keys(freshVars.variables).slice(0, 5),
              format: "camelCase (from buildDynamicVariables)",
              warning:
                "These are camelCase and need to be converted to snake_case for VAPI",
            },
          );

          // Merge: Extracted AI vars (snake_case) + Fresh Clinical Vars (camelCase) + Stored Vars (snake_case)
          // Extracted vars are merged first, then fresh vars normalized, then stored vars override
          dynamicVariables = {
            ...extractedVars, // Already snake_case (patient_species, patient_breed, etc.)
            ...normalizeVariablesToSnakeCase(
              freshVars.variables as unknown as Record<string, unknown>,
            ), // Convert camelCase to snake_case
            ...dynamicVariables, // Stored vars override (preserves manual overrides)
          };

          console.log("[EXECUTE_CALL] Merged variables (mixed format)", {
            callId,
            variableCount: Object.keys(dynamicVariables).length,
            sampleKeys: Object.keys(dynamicVariables).slice(0, 10),
            format: "mixed (snake_case + camelCase)",
            note: "Will be normalized to snake_case before sending to VAPI",
          });
        }
      } catch (enrichError) {
        console.error(
          "[EXECUTE_CALL] Failed to enrich with case data",
          enrichError,
        );
        // Continue with stored variables
      }
    }

    // CRITICAL: Normalize all variables to snake_case format for VAPI
    // VAPI system prompt expects snake_case variables ({{pet_name}}, {{owner_name}}, etc.)
    const normalizedVariables = normalizeVariablesToSnakeCase(dynamicVariables);

    // Determine if clinic is open at execution time (for transfer availability)
    // Get timezone from metadata or default to America/Los_Angeles
    const callTimezone =
      (metadata?.timezone as string) ?? "America/Los_Angeles";
    const isClinicOpen = isWithinBusinessHours(new Date(), callTimezone);
    normalizedVariables.clinic_is_open = isClinicOpen ? "true" : "false";

    console.log("[EXECUTE_CALL] Clinic open status", {
      callId,
      timezone: callTimezone,
      isClinicOpen,
      clinic_is_open: normalizedVariables.clinic_is_open,
    });

    console.log("[EXECUTE_CALL] Normalized variables (ready for VAPI)", {
      callId,
      variableCount: Object.keys(normalizedVariables).length,
      sampleKeys: Object.keys(normalizedVariables).slice(0, 10),
      format: "snake_case (normalized)",
      keyExamples: {
        pet_name: normalizedVariables.pet_name,
        owner_name: normalizedVariables.owner_name,
        clinic_name: normalizedVariables.clinic_name,
        agent_name: normalizedVariables.agent_name,
        appointment_date: normalizedVariables.appointment_date,
      },
    });

    // Get VAPI configuration
    const assistantId = call.assistant_id;
    const phoneNumberId = call.phone_number_id;

    if (!assistantId) {
      console.error("[EXECUTE_CALL] Missing assistant_id");
      return NextResponse.json(
        { error: "Missing assistant_id configuration" },
        { status: 500 },
      );
    }

    if (!phoneNumberId) {
      console.error("[EXECUTE_CALL] Missing phone_number_id");
      return NextResponse.json(
        { error: "Missing phone_number_id configuration" },
        { status: 500 },
      );
    }

    // Fetch user's voicemail detection settings
    const { data: userSettings } = await supabase
      .from("users")
      .select(
        "voicemail_detection_enabled, voicemail_hangup_on_detection, voicemail_message",
      )
      .eq("id", call.user_id)
      .single();

    const voicemailDetectionEnabled =
      userSettings?.voicemail_detection_enabled ?? false;
    const voicemailHangupOnDetection =
      userSettings?.voicemail_hangup_on_detection ?? false;
    const customVoicemailMessage = userSettings?.voicemail_message ?? null;

    console.log("[EXECUTE_CALL] Voicemail detection settings", {
      callId,
      voicemailDetectionEnabled,
      voicemailHangupOnDetection,
      hasCustomMessage: !!customVoicemailMessage,
    });

    // Default voicemail message template (used if no custom message is set)
    const defaultVoicemailMessage = `Hi {{owner_name}}, this is {{agent_name}} from {{clinic_name}}. I'm calling to check in on {{pet_name}} after the recent visit. Everything looked great from our end. If you have any questions or concerns about {{pet_name}}, please give us a call at {{clinic_phone}}. Take care!`;

    // Build voicemail detection config based on user settings
    // Using VAPI's voicemailDetection plan approach (not tool-based)
    // See: https://docs.vapi.ai/calls/voicemail-detection
    const buildVoicemailConfig = () => {
      if (!voicemailDetectionEnabled) {
        return { voicemailDetection: "off" as const };
      }

      // Voicemail detection enabled - configure the detection plan
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
        // Hang up immediately without leaving a message
        config.voicemailMessage = "";
      } else {
        // Leave a voicemail message - use custom message if set, otherwise default
        config.voicemailMessage =
          customVoicemailMessage ?? defaultVoicemailMessage;
      }

      return config;
    };

    // Prepare VAPI call parameters
    // Use normalized snake_case variables that match the system prompt placeholders
    const vapiParams = {
      phoneNumber: call.customer_phone,
      assistantId,
      phoneNumberId,
      assistantOverrides: {
        // Always include variable values if we have them
        ...(Object.keys(normalizedVariables).length > 0 && {
          variableValues: normalizedVariables,
        }),
        // Voicemail detection configuration based on user settings
        ...buildVoicemailConfig(),
      },
    };

    console.log("[EXECUTE_CALL] Calling VAPI API with parameters", {
      callId,
      phoneNumber: call.customer_phone,
      assistantId,
      phoneNumberId,
      hasAssistantOverrides: !!vapiParams.assistantOverrides,
      variableCount: Object.keys(normalizedVariables).length,
      variableKeys: Object.keys(normalizedVariables),
      criticalVariables: {
        pet_name: normalizedVariables.pet_name,
        owner_name: normalizedVariables.owner_name,
        clinic_name: normalizedVariables.clinic_name,
        agent_name: normalizedVariables.agent_name,
        appointment_date: normalizedVariables.appointment_date,
        call_type: normalizedVariables.call_type,
        discharge_summary_content:
          normalizedVariables.discharge_summary_content &&
          typeof normalizedVariables.discharge_summary_content === "string"
            ? `${normalizedVariables.discharge_summary_content.substring(
                0,
                50,
              )}...`
            : undefined,
      },
    });

    // Execute call via VAPI
    let response;
    try {
      response = await createPhoneCall(vapiParams);
    } catch (vapiError) {
      // VAPI call failed - mark as failed and return 200 to prevent QStash retry
      // We don't want to retry VAPI failures as they would likely fail again
      // (invalid phone, API issues, etc.)
      const errorMessage =
        vapiError instanceof Error ? vapiError.message : String(vapiError);

      console.error("[EXECUTE_CALL] VAPI API failed", {
        callId,
        error: errorMessage,
      });

      // Update database with failure status
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

      // Return 200 to prevent QStash from retrying - we've handled this failure
      return NextResponse.json({
        success: false,
        message: "VAPI call failed",
        error: errorMessage,
        callId,
      });
    }

    console.log("[EXECUTE_CALL] VAPI API success", {
      callId,
      vapiCallId: response.id,
      status: response.status,
    });

    // Update database with VAPI response
    await supabase
      .from("scheduled_discharge_calls")
      .update({
        vapi_call_id: response.id,
        status: mapVapiStatus(response.status),
        started_at: response.startedAt ?? null,
        metadata: {
          ...metadata,
          executed_at: new Date().toISOString(),
          voicemail_detection_enabled: voicemailDetectionEnabled,
          voicemail_hangup_on_detection: voicemailHangupOnDetection,
        },
      })
      .eq("id", callId);

    return NextResponse.json({
      success: true,
      message: "Call executed successfully",
      vapiCallId: response.id,
      status: response.status,
    });
  } catch (error) {
    // This catch block handles unexpected infrastructure errors
    // (DB connection issues, etc.) - these could potentially be retried
    // but since we set retries: 0 in QStash, they won't be
    console.error("[EXECUTE_CALL] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Wrap handler with QStash signature verification
export const POST = verifySignatureAppRouter(handler);

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Execute call webhook is active",
  });
}

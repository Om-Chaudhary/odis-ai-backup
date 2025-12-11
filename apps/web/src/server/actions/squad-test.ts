"use server";

import { createSquadPhoneCall } from "@odis-ai/vapi";
import { env } from "@odis-ai/env";
import { createServiceClient } from "@odis-ai/db/server";
import type {
  RecentCaseOption,
  SquadTestCallResult,
  SquadTestVariables,
} from "./squad-test.types";

/**
 * Squad ID for the follow-up squad (odis_followup_squad_v1)
 * This squad has: greeter -> assessor -> closer flow
 */
const FOLLOWUP_SQUAD_ID = "d4305e87-1c5a-4d45-8953-2525e2d88244";

/**
 * Fetches recent cases with valid dynamic_variables from completed calls
 *
 * @param limit - Maximum number of cases to return (default: 10)
 * @returns Array of recent cases with their dynamic_variables
 */
export async function getRecentCasesForPrefill(
  limit = 10,
): Promise<RecentCaseOption[]> {
  try {
    const supabase = await createServiceClient();

    // Fetch recent completed calls with valid dynamic_variables
    const { data: calls, error } = await supabase
      .from("scheduled_discharge_calls")
      .select(
        `
        id,
        created_at,
        dynamic_variables,
        cases!scheduled_discharge_calls_case_id_fkey (
          id,
          patients (
            name,
            owner_name
          )
        )
      `,
      )
      .not("dynamic_variables", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[SQUAD_TEST] Error fetching recent cases:", error);
      return [];
    }

    // Transform to RecentCaseOption format
    const options: RecentCaseOption[] = [];

    for (const call of calls ?? []) {
      const vars = call.dynamic_variables as Record<string, unknown> | null;
      if (!vars?.pet_name) continue;

      // Get patient info from the case relation
      const caseData = call.cases as unknown as {
        id: string;
        patients: Array<{ name: string; owner_name: string }>;
      } | null;
      const patient = caseData?.patients?.[0];

      options.push({
        id: call.id,
        petName: (vars.pet_name as string) ?? patient?.name ?? "Unknown",
        ownerName:
          (vars.owner_name as string) ?? patient?.owner_name ?? "Unknown",
        diagnosis:
          (vars.primary_diagnosis as string) ||
          (vars.visit_reason as string) ||
          "N/A",
        createdAt: call.created_at,
        dynamicVariables: vars,
      });
    }

    return options;
  } catch (error) {
    console.error("[SQUAD_TEST] Failed to fetch recent cases:", error);
    return [];
  }
}

/**
 * Converts dynamic_variables from a recent call to SquadTestVariables format
 */
export async function convertToSquadVariables(
  dynamicVars: Record<string, unknown>,
): Promise<SquadTestVariables> {
  // Helper to stringify arrays/objects
  const stringify = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        // If JSON.stringify fails, return empty string rather than "[object Object]"
        return "";
      }
    }
    // For primitives (number, boolean, etc.), String() is safe
    return typeof val === "number" || typeof val === "boolean"
      ? String(val)
      : "";
  };

  return {
    // Basic Info
    agent_name: (dynamicVars.agent_name as string) || "Sarah",
    clinic_name:
      (dynamicVars.clinic_name as string) || "Alum Rock Pet Hospital",
    pet_name: (dynamicVars.pet_name as string) || "",
    owner_name: (dynamicVars.owner_name as string) || "",
    patient_species: (dynamicVars.patient_species as string) || "dog",
    patient_breed: (dynamicVars.patient_breed as string) || undefined,

    // Visit Details
    visit_reason: (dynamicVars.visit_reason as string) || "",
    primary_diagnosis: (dynamicVars.primary_diagnosis as string) || "",
    condition_category: (dynamicVars.condition_category as string) || "general",
    call_type: (dynamicVars.call_type as string) || "follow-up",
    appointment_date: (dynamicVars.appointment_date as string) || "",

    // Contact Info
    clinic_phone:
      (dynamicVars.clinic_phone as string) ||
      "four zero eight, two five eight, two seven three five",
    emergency_phone:
      (dynamicVars.emergency_phone as string) ||
      "four zero eight, eight six five, four three two one",
    clinic_is_open: (dynamicVars.clinic_is_open as string) || "true",

    // Patient Details
    patient_age: (dynamicVars.patient_age as string) || undefined,
    patient_sex: (dynamicVars.patient_sex as string) || undefined,
    patient_weight: (dynamicVars.patient_weight as string) || undefined,
    prognosis: (dynamicVars.prognosis as string) || undefined,

    // Medications
    medications_detailed:
      (dynamicVars.medications_detailed as string) || undefined,
    medication_names: (dynamicVars.medication_names as string) || undefined,

    // Follow-up
    procedures: (dynamicVars.procedures as string) || undefined,
    recheck_required: (dynamicVars.recheck_required as string) || undefined,
    recheck_date: (dynamicVars.recheck_date as string) || undefined,

    // Clinical Arrays (ensure they're stringified)
    warning_signs_to_monitor: stringify(dynamicVars.warning_signs_to_monitor),
    normal_post_treatment_expectations: stringify(
      dynamicVars.normal_post_treatment_expectations,
    ),
    emergency_criteria: stringify(dynamicVars.emergency_criteria),
    urgent_criteria: stringify(dynamicVars.urgent_criteria),
    assessment_questions: stringify(dynamicVars.assessment_questions),
  };
}

/**
 * Initiates a test outbound call using the follow-up squad
 *
 * @param phoneNumber - Phone number to call (E.164 format)
 * @param variables - Template variables for the squad prompts
 * @returns Call result with ID and status
 */
export async function initiateSquadTestCall(
  phoneNumber: string,
  variables: SquadTestVariables,
): Promise<SquadTestCallResult> {
  try {
    // Validate phone number format
    if (!phoneNumber?.startsWith("+")) {
      return {
        success: false,
        error: "Phone number must be in E.164 format (e.g., +1234567890)",
      };
    }

    // Get phone number ID from environment
    const phoneNumberId = env.VAPI_PHONE_NUMBER_ID;
    if (!phoneNumberId) {
      return {
        success: false,
        error: "VAPI_PHONE_NUMBER_ID not configured",
      };
    }

    console.log("[SQUAD_TEST] Initiating squad test call", {
      phoneNumber,
      squadId: FOLLOWUP_SQUAD_ID,
      variableCount: Object.keys(variables).length,
    });

    // Create the squad call
    const callResponse = await createSquadPhoneCall({
      phoneNumber,
      squadId: FOLLOWUP_SQUAD_ID,
      phoneNumberId,
      assistantOverrides: {
        variableValues: variables as unknown as Record<string, unknown>,
      },
    });

    console.log("[SQUAD_TEST] Squad call initiated successfully", {
      callId: callResponse.id,
      status: callResponse.status,
    });

    return {
      success: true,
      callId: callResponse.id,
      status: callResponse.status,
    };
  } catch (error) {
    console.error("[SQUAD_TEST] Failed to initiate squad call:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

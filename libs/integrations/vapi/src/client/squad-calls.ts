/**
 * VAPI Squad Call Operations
 *
 * Functions for creating outbound phone calls using VAPI Squads.
 * Squads allow multi-assistant flows with handoffs between specialists.
 *
 * @see https://docs.vapi.ai/squads
 */

import type { VapiCallResponse } from "./types";
import {
  extractSampleVariables,
  formatVariablesForLogging,
  getVapiClient,
} from "./utils";

/**
 * Parameters for creating an outbound phone call using a Squad
 */
export interface CreateSquadPhoneCallParams {
  /** Customer's phone number in E.164 format (+1234567890) */
  phoneNumber: string;

  /** VAPI squad ID to use for the call */
  squadId: string;

  /** VAPI phone number ID for the caller ID */
  phoneNumberId: string;

  /**
   * Dynamic overrides to customize the squad members for this specific call.
   * Variables are passed to all squad members' system prompts.
   *
   * Note: When using a permanent squadId, variables are passed via top-level
   * `assistantOverrides.variableValues` which applies to ALL squad members.
   * This is the same structure as single assistant calls.
   *
   * @see https://docs.vapi.ai/squads
   */
  assistantOverrides?: {
    /** Template variables for {{variable}} placeholders in system prompts */
    variableValues?: Record<string, unknown>;
  };
}

/**
 * Creates an outbound phone call using a VAPI Squad
 *
 * Squads allow multi-assistant flows with handoffs between specialists.
 * Use this for complex call flows like the follow-up squad with greeter/assessor/closer.
 *
 * IMPORTANT: For permanent squads (using squadId), variables are passed via top-level
 * `assistantOverrides.variableValues` which applies to ALL squad members automatically.
 *
 * @param params - Squad call parameters
 * @returns VAPI call response
 * @see https://docs.vapi.ai/squads
 */
export async function createSquadPhoneCall(
  params: CreateSquadPhoneCallParams,
): Promise<VapiCallResponse> {
  const vapi = getVapiClient();

  const variableValues = params.assistantOverrides?.variableValues;

  const callPayload: Record<string, unknown> = {
    phoneNumberId: params.phoneNumberId,
    customer: {
      number: params.phoneNumber,
    },
    squadId: params.squadId,
  };

  if (variableValues && Object.keys(variableValues).length > 0) {
    callPayload.assistantOverrides = {
      variableValues: variableValues,
    };
  }

  const variableKeys = variableValues ? Object.keys(variableValues) : [];

  console.log("[VAPI_CLIENT] Creating squad phone call with payload", {
    phoneNumber: params.phoneNumber,
    squadId: params.squadId,
    phoneNumberId: params.phoneNumberId,
    hasAssistantOverrides: !!callPayload.assistantOverrides,
    variableCount: variableKeys.length,
    variableFormat: "snake_case (expected by VAPI)",
    sampleVariableKeys: variableKeys.slice(0, 10),
    sampleVariables: extractSampleVariables(variableValues),
    variableValues: formatVariablesForLogging(variableValues),
    payloadStructure: {
      squadId: params.squadId,
      assistantOverrides: callPayload.assistantOverrides
        ? "present"
        : "not present",
    },
  });

  try {
    const call = await vapi.calls.create(callPayload);
    const callResponse = call as VapiCallResponse;

    console.log("[VAPI_CLIENT] Squad phone call created successfully", {
      vapiCallId: callResponse.id,
      status: callResponse.status,
      type: callResponse.type,
      squadId: params.squadId,
    });

    return callResponse;
  } catch (error) {
    console.error("[VAPI_CLIENT] Failed to create squad phone call:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      payload: callPayload,
    });
    throw error;
  }
}

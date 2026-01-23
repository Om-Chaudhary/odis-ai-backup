/**
 * VAPI Phone Call Operations
 *
 * Functions for creating outbound phone calls using VAPI.
 *
 * ## VAPI Integration Architecture
 *
 * This project uses a **Permanent Assistant** approach where:
 * - The assistant is configured in VAPI Dashboard (model, voice, system prompt, tools)
 * - Per-call customization is done via `assistantOverrides.variableValues`
 *
 * ## What CAN be set via assistantOverrides:
 * - `variableValues` - Dynamic template variables (e.g., pet_name, owner_name)
 * - `voicemailDetection` - Voicemail detection settings (can be set to "off" to disable)
 * - `customerJoinTimeoutSeconds` - Timeout settings
 * - `recordingEnabled` - Recording toggle
 * - `toolIds` - Reference pre-configured tools by ID (NOT tool definitions)
 *
 * ## What CANNOT be set via assistantOverrides (must be in Dashboard):
 * - `tools` array - Tool definitions must be configured in dashboard
 * - `model.messages` - System prompt
 * - `voice` - Voice configuration
 *
 * @see https://docs.vapi.ai/assistants/concepts/transient-vs-permanent-configurations
 * @see https://docs.vapi.ai/calls/voicemail-detection
 */

import type { VapiCallResponse, VoicemailDetectionPlan } from "./types";
import {
  extractSampleVariables,
  formatVariablesForLogging,
  getVapiClient,
} from "./utils";

/**
 * Parameters for creating an outbound phone call
 */
export interface CreatePhoneCallParams {
  /** Customer's phone number in E.164 format (+1234567890) */
  phoneNumber: string;

  /** VAPI assistant ID to use for the call */
  assistantId: string;

  /** VAPI phone number ID for the caller ID */
  phoneNumberId: string;

  /**
   * Dynamic overrides to customize the assistant for this specific call.
   *
   * Supported overrides:
   * - `variableValues` - Template variables for system prompt placeholders
   * - `voicemailDetection` - Configure voicemail detection behavior
   * - `voicemailMessage` - Message to say on voicemail (if undefined, hangs up immediately)
   * - `toolIds` - Array of pre-configured tool IDs to enable (NOT tool definitions)
   * - `customerJoinTimeoutSeconds` - Timeout for customer to join
   * - `recordingEnabled` - Whether to record the call
   *
   * Note: Tools array (tool definitions), model, and voice CANNOT be set here -
   * they must be configured in the VAPI Dashboard at the assistant level.
   *
   * @see https://docs.vapi.ai/assistants/concepts/transient-vs-permanent-configurations
   * @see https://docs.vapi.ai/calls/voicemail-detection
   */
  assistantOverrides?: {
    /** Template variables for {{variable}} placeholders in system prompt */
    variableValues?: Record<string, unknown>;
    /**
     * Voicemail detection configuration.
     *
     * Options:
     * - "off" - Completely disable voicemail detection
     * - VapiVoicemailDetectionPlan - Use Vapi's AI detection (recommended)
     * - TwilioVoicemailDetectionPlan - Use Twilio's carrier-level detection
     * - GoogleVoicemailDetectionPlan - Use Google's AI detection
     * - OpenAiVoicemailDetectionPlan - Use OpenAI's detection
     *
     * @see https://docs.vapi.ai/calls/voicemail-detection
     */
    voicemailDetection?: "off" | VoicemailDetectionPlan;
    /**
     * Message to say when voicemail is detected.
     * If unspecified/undefined, the call will hang up immediately without leaving a message.
     */
    voicemailMessage?: string;
    /** Pre-configured tool IDs to enable for this call */
    toolIds?: string[];
  };
}

/**
 * Creates an outbound phone call using VAPI
 *
 * @param params - Call parameters
 * @returns VAPI call response
 */
export async function createPhoneCall(
  params: CreatePhoneCallParams,
): Promise<VapiCallResponse> {
  const vapi = getVapiClient();

  const callPayload = {
    phoneNumberId: params.phoneNumberId,
    customer: {
      number: params.phoneNumber,
    },
    assistantId: params.assistantId,
    assistantOverrides: params.assistantOverrides as Record<string, unknown>,
  };

  const variableValues = params.assistantOverrides?.variableValues;
  const variableKeys = variableValues ? Object.keys(variableValues) : [];

  console.log("[VAPI_CLIENT] Creating phone call with payload", {
    phoneNumber: params.phoneNumber,
    assistantId: params.assistantId,
    phoneNumberId: params.phoneNumberId,
    hasAssistantOverrides: !!params.assistantOverrides,
    variableCount: variableKeys.length,
    variableFormat: "snake_case (expected by VAPI)",
    sampleVariableKeys: variableKeys.slice(0, 10),
    sampleVariables: extractSampleVariables(variableValues),
    variableValues: formatVariablesForLogging(variableValues),
  });

  try {
    const call = await vapi.calls.create(callPayload);
    const callResponse = call as VapiCallResponse;

    console.log("[VAPI_CLIENT] Phone call created successfully", {
      vapiCallId: callResponse.id,
      status: callResponse.status,
      type: callResponse.type,
    });

    return callResponse;
  } catch (error) {
    console.error("[VAPI_CLIENT] Failed to create phone call:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      payload: callPayload,
    });
    throw error;
  }
}

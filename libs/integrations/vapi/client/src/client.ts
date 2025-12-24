/**
 * VAPI Client Wrapper
 *
 * Server-side wrapper for VAPI SDK to make phone calls.
 * Provides type-safe interface for creating and managing VAPI calls.
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

import { VapiClient } from "@vapi-ai/server-sdk";
import { env } from "@odis-ai/shared/env";

/**
 * Get VAPI client instance
 * Uses the private API key for server-side operations
 */
export function getVapiClient() {
  const apiKey = env.VAPI_PRIVATE_KEY ?? process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_KEY not configured in environment variables");
  }

  const client = new VapiClient({
    token: apiKey,
  });

  return client;
}

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
 * Voicemail detection plan configuration.
 * Used to configure which provider handles voicemail detection and how.
 */
export interface VoicemailDetectionPlan {
  /**
   * The voicemail detection provider to use.
   * - "vapi" - Vapi's AI-powered detection (recommended, fastest)
   * - "twilio" - Twilio's carrier-level AMD
   * - "google" - Google's AI detection
   * - "openai" - OpenAI's detection
   */
  provider: "vapi" | "twilio" | "google" | "openai";
  /**
   * Detection type (for vapi/google/openai providers).
   * - "audio" - Uses native audio models (default, recommended for vapi/google)
   * - "transcript" - Uses ASR/transcript-based detection (recommended for openai)
   */
  type?: "audio" | "transcript";
  /**
   * Whether detection is enabled. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Twilio-specific: Maximum seconds to wait for detection.
   * Lower values = faster but potentially less accurate.
   * Default: 30, Recommended: 5-15 for faster detection.
   */
  machineDetectionTimeout?: number;
  /**
   * Twilio-specific: Detection types to treat as voicemail.
   * Default: ["machine_end_beep", "machine_end_silence"]
   */
  voicemailDetectionTypes?: string[];
}

/**
 * Voicemail tool configuration
 */
export interface VoicemailTool {
  type: "voicemail";
  function: {
    name: string;
    description: string;
  };
  messages?: Array<{
    type: string;
    content: string;
  }>;
}

/**
 * Transfer call tool configuration for warm transfers
 * See: https://docs.vapi.ai/calls/assistant-based-warm-transfer
 */
export interface TransferCallTool {
  type: "transferCall";
  function: {
    name: string;
    description?: string;
  };
  destinations: Array<TransferDestination>;
  messages?: Array<{
    type: "request-start" | "request-complete" | "request-failed";
    content: string;
    endCallAfterSpokenEnabled?: boolean;
  }>;
}

/**
 * Transfer destination with warm transfer plan
 */
export interface TransferDestination {
  type: "number";
  number: string;
  description?: string;
  transferPlan: {
    mode: "warm-transfer-experimental";
    transferAssistant: TransferAssistant;
  };
}

/**
 * Transfer assistant configuration for warm handoff
 */
export interface TransferAssistant {
  /** Initial message spoken when operator answers */
  firstMessage: string;
  /** Controls when the transfer assistant delivers the first message */
  firstMessageMode?: "assistant-speaks-first" | "assistant-waits-for-user";
  /** Maximum duration in seconds for the operator call */
  maxDurationSeconds?: number;
  /** Seconds to wait during silence before cancelling */
  silenceTimeoutSeconds?: number;
  /** Model configuration */
  model: {
    provider: "openai" | "anthropic" | "google";
    model: string;
    messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>;
  };
}

/**
 * VAPI call response structure
 */
export interface VapiCallResponse {
  id: string;
  orgId: string;
  type: "outboundPhoneCall" | "inboundPhoneCall" | "webCall";
  phoneNumber?: {
    number: string;
    id: string;
  };
  customer?: {
    number: string;
  };
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  endedReason?: string;
  messages?: Array<{
    role: "assistant" | "user" | "system";
    message: string;
    time: number;
  }>;
  transcript?: string;
  recordingUrl?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
  };
  costs?: Array<{
    amount: number;
    description: string;
  }>;
  startedAt?: string;
  endedAt?: string;
  assistantId?: string;
  createdAt: string;
  updatedAt: string;
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

  // Build call payload with proper typing
  // The assistantOverrides can include voicemailDetection which the SDK accepts
  // but TypeScript may not fully recognize all valid override options
  const callPayload = {
    phoneNumberId: params.phoneNumberId,
    customer: {
      number: params.phoneNumber,
    },
    assistantId: params.assistantId,
    // Cast to allow voicemailDetection and voicemailMessage in overrides
    // These are valid VAPI API properties as per docs.vapi.ai/calls/voicemail-detection
    assistantOverrides: params.assistantOverrides as Record<string, unknown>,
  };

  // Log variable format verification
  const variableValues = params.assistantOverrides?.variableValues;
  const variableKeys = variableValues ? Object.keys(variableValues) : [];
  const sampleVariables = variableValues
    ? {
        pet_name: variableValues.pet_name,
        owner_name: variableValues.owner_name,
        clinic_name: variableValues.clinic_name,
        agent_name: variableValues.agent_name,
        appointment_date: variableValues.appointment_date,
      }
    : {};

  console.log("[VAPI_CLIENT] Creating phone call with payload", {
    phoneNumber: params.phoneNumber,
    assistantId: params.assistantId,
    phoneNumberId: params.phoneNumberId,
    hasAssistantOverrides: !!params.assistantOverrides,
    variableCount: variableKeys.length,
    variableFormat: "snake_case (expected by VAPI)",
    sampleVariableKeys: variableKeys.slice(0, 10),
    sampleVariables,
    // Log full variable values for debugging (truncate long values)
    variableValues: variableValues
      ? Object.fromEntries(
          Object.entries(variableValues).map(([key, value]) => [
            key,
            typeof value === "string" && value.length > 100
              ? `${value.substring(0, 100)}...`
              : value,
          ]),
        )
      : undefined,
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

  // Extract variable values
  const variableValues = params.assistantOverrides?.variableValues;

  // Build call payload for squad
  // CRITICAL: For squads with squadId, use assistantOverrides to apply variables to ALL members
  // The assistantOverrides at the top level applies to all squad members
  const callPayload: Record<string, unknown> = {
    phoneNumberId: params.phoneNumberId,
    customer: {
      number: params.phoneNumber,
    },
    squadId: params.squadId,
  };

  // Add assistantOverrides if we have variable values
  // This applies the variables to all members of the squad
  if (variableValues && Object.keys(variableValues).length > 0) {
    callPayload.assistantOverrides = {
      variableValues: variableValues,
    };
  }

  // Log variable format verification
  const variableKeys = variableValues ? Object.keys(variableValues) : [];
  const sampleVariables = variableValues
    ? {
        pet_name: variableValues.pet_name,
        owner_name: variableValues.owner_name,
        clinic_name: variableValues.clinic_name,
        agent_name: variableValues.agent_name,
      }
    : {};

  console.log("[VAPI_CLIENT] Creating squad phone call with payload", {
    phoneNumber: params.phoneNumber,
    squadId: params.squadId,
    phoneNumberId: params.phoneNumberId,
    hasAssistantOverrides: !!callPayload.assistantOverrides,
    variableCount: variableKeys.length,
    variableFormat: "snake_case (expected by VAPI)",
    sampleVariableKeys: variableKeys.slice(0, 10),
    sampleVariables,
    // Log full variable values for debugging (truncate long values)
    variableValues: variableValues
      ? Object.fromEntries(
          Object.entries(variableValues).map(([key, value]) => [
            key,
            typeof value === "string" && value.length > 100
              ? `${value.substring(0, 100)}...`
              : value,
          ]),
        )
      : undefined,
    // Log the actual payload structure being sent
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

/**
 * Gets a call by ID
 *
 * @param callId - VAPI call ID
 * @returns Call details
 */
export async function getCall(callId: string): Promise<VapiCallResponse> {
  const vapi = getVapiClient();

  try {
    const call = await vapi.calls.get(callId);
    return call as VapiCallResponse;
  } catch (error) {
    console.error(`[VAPI_CLIENT] Failed to get call ${callId}:`, error);
    throw error;
  }
}

/**
 * Lists calls with optional filters
 *
 * @param options - Query options
 * @returns Array of calls
 */
export async function listCalls(options?: {
  limit?: number;
  createdAtGt?: Date;
  createdAtLt?: Date;
  createdAtGe?: Date;
  createdAtLe?: Date;
}): Promise<VapiCallResponse[]> {
  const vapi = getVapiClient();

  try {
    const calls = await vapi.calls.list({
      limit: options?.limit,
      createdAtGt: options?.createdAtGt?.toISOString(),
      createdAtLt: options?.createdAtLt?.toISOString(),
      createdAtGe: options?.createdAtGe?.toISOString(),
      createdAtLe: options?.createdAtLe?.toISOString(),
    });

    return calls as VapiCallResponse[];
  } catch (error) {
    console.error("[VAPI_CLIENT] Failed to list calls:", error);
    throw error;
  }
}

// Note: Status mapping utilities are available from @odis-ai/integrations/vapi/webhooks/utils
// Consumers should import mapVapiStatus, shouldMarkAsFailed from there directly

/**
 * Calculates total cost from VAPI costs array
 *
 * @param costs - Array of VAPI cost objects
 * @returns Total cost in USD
 */
export function calculateTotalCost(
  costs?: Array<{ amount: number; description: string }>,
): number {
  if (!costs || costs.length === 0) return 0;

  return costs.reduce((total, cost) => total + cost.amount, 0);
}

// =============================================================================
// Assistant Configuration
// =============================================================================

/**
 * Server configuration for VAPI assistant webhooks
 */
export interface AssistantServerConfig {
  /** The webhook URL where VAPI will send events */
  url: string;
  /** Optional timeout for webhook requests (in seconds) */
  timeoutSeconds?: number;
  /** Optional secret for webhook signature verification */
  secret?: string;
}

/**
 * Updates an assistant's server (webhook) configuration
 *
 * This is required for VAPI to send webhook events like:
 * - status-update: Call status changes
 * - end-of-call-report: Comprehensive call data at end
 * - hang: Call termination
 * - tool-calls: Server-side tool execution
 *
 * @param assistantId - VAPI assistant ID
 * @param serverConfig - Server configuration
 * @returns Updated assistant data
 *
 * @example
 * await updateAssistantServer('ae3e6a54-...', {
 *   url: 'https://odisai.net/api/webhooks/vapi',
 *   secret: process.env.VAPI_WEBHOOK_SECRET
 * });
 */
export async function updateAssistantServer(
  assistantId: string,
  serverConfig: AssistantServerConfig,
): Promise<Record<string, unknown>> {
  const apiKey = env.VAPI_PRIVATE_KEY ?? process.env.VAPI_PRIVATE_KEY;

  if (!apiKey) {
    throw new Error("VAPI_PRIVATE_KEY not configured in environment variables");
  }

  const response = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      server: serverConfig,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[VAPI_CLIENT] Failed to update assistant server config:", {
      assistantId,
      status: response.status,
      error,
    });
    throw new Error(`Failed to update assistant: ${response.status} ${error}`);
  }

  const data = await response.json();

  console.log("[VAPI_CLIENT] Assistant server config updated successfully", {
    assistantId,
    serverUrl: serverConfig.url,
  });

  return data as Record<string, unknown>;
}

/**
 * Gets an assistant's current configuration
 *
 * @param assistantId - VAPI assistant ID
 * @returns Assistant configuration
 */
export async function getAssistant(
  assistantId: string,
): Promise<Record<string, unknown>> {
  const vapi = getVapiClient();

  try {
    const assistant = await vapi.assistants.get(assistantId);
    return assistant as Record<string, unknown>;
  } catch (error) {
    console.error(
      `[VAPI_CLIENT] Failed to get assistant ${assistantId}:`,
      error,
    );
    throw error;
  }
}

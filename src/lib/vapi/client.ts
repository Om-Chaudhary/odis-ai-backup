/**
 * VAPI Client Wrapper
 *
 * Server-side wrapper for VAPI SDK to make phone calls.
 * Provides type-safe interface for creating and managing VAPI calls.
 */

import { VapiClient } from "@vapi-ai/server-sdk";
import { env } from "~/env";

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

  /** Dynamic variables to pass to the assistant */
  assistantOverrides?: {
    variableValues?: Record<string, unknown>;
    /** Tools to enable/override for this call (e.g., voicemail, transferCall) */
    tools?: Array<VoicemailTool | TransferCallTool>;
  };
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

  const callPayload = {
    phoneNumberId: params.phoneNumberId,
    customer: {
      number: params.phoneNumber,
    },
    assistantId: params.assistantId,
    assistantOverrides: params.assistantOverrides,
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

/**
 * Maps VAPI status to our internal database status
 *
 * @param vapiStatus - VAPI call status
 * @returns Our database status
 */
export function mapVapiStatus(
  vapiStatus: string | undefined,
): "queued" | "ringing" | "in_progress" | "completed" | "failed" | "cancelled" {
  if (!vapiStatus) return "queued";

  const statusMap: Record<
    string,
    "queued" | "ringing" | "in_progress" | "completed" | "failed" | "cancelled"
  > = {
    queued: "queued",
    ringing: "ringing",
    "in-progress": "in_progress",
    forwarding: "in_progress",
    ended: "completed",
  };

  const mappedStatus = statusMap[vapiStatus.toLowerCase()];

  if (!mappedStatus) {
    console.warn(
      `[VAPI_CLIENT] Unknown VAPI status: ${vapiStatus}, defaulting to queued`,
    );
    return "queued";
  }

  return mappedStatus;
}

/**
 * Determines if a call should be marked as failed based on ended reason
 *
 * @param endedReason - VAPI ended reason
 * @param metadata - Call metadata including voicemail settings
 * @returns True if call should be marked as failed
 */
export function shouldMarkAsFailed(
  endedReason?: string,
  metadata?: Record<string, unknown>,
): boolean {
  if (!endedReason) return false;

  // Voicemail handling:
  // - If voicemail detection enabled AND hangup is false: DON'T mark as failed (message was left)
  // - If voicemail detection enabled AND hangup is true: MARK as failed (hung up without message)
  if (
    endedReason.toLowerCase().includes("voicemail") &&
    metadata?.voicemail_detection_enabled === true
  ) {
    const hangupOnVoicemail = metadata?.voicemail_hangup_on_detection === true;
    return hangupOnVoicemail; // Failed only if we hung up without leaving message
  }

  const failedReasons = [
    "dial-busy",
    "dial-failed",
    "dial-no-answer",
    "assistant-error",
    "exceeded-max-duration",
    "voicemail",
    "assistant-not-found",
    "assistant-not-invalid",
    "assistant-not-provided",
    "assistant-request-failed",
    "assistant-request-returned-error",
    "assistant-request-returned-unspeakable-error",
    "assistant-request-returned-invalid-json",
    "assistant-request-returned-no-content",
  ];

  return failedReasons.some((reason) =>
    endedReason.toLowerCase().includes(reason.toLowerCase()),
  );
}

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

/**
 * Call Data Enrichment Utilities
 *
 * Handles merging, transformation, and detection of call data
 * from various VAPI webhook formats.
 *
 * @module vapi/webhooks/utils/call-enricher
 */

import type { VapiAnalysis, VapiArtifact, VapiWebhookCall } from "../types";

/**
 * Determine if a call is inbound based on call type
 *
 * @param call - VAPI call object
 * @returns True if call is inbound
 */
export function isInboundCall(call?: VapiWebhookCall): boolean {
  return call?.type === "inboundPhoneCall";
}

/**
 * Get the appropriate table name for a call
 *
 * @param isInbound - Whether the call is inbound
 * @returns Table name
 */
export function getCallTableName(isInbound: boolean): string {
  return isInbound ? "inbound_vapi_calls" : "scheduled_discharge_calls";
}

/**
 * Merge message-level fields with call-level fields for end-of-call-report
 *
 * VAPI sends some fields directly on message for end-of-call-report events,
 * not nested inside message.call. This function merges them.
 *
 * @param call - Call object from message.call
 * @param message - Full message object
 * @returns Enriched call object
 */
export function enrichCallFromMessage(
  call: VapiWebhookCall,
  message: {
    status?: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
    startedAt?: string;
    endedAt?: string;
    transcript?: string;
    recordingUrl?: string;
    endedReason?: string;
    analysis?: VapiAnalysis;
    cost?: number;
    artifact?: VapiArtifact;
  },
): VapiWebhookCall {
  return {
    ...call,
    // Prefer message-level fields (VAPI's primary location for end-of-call-report)
    // Status is critical - VAPI sends "ended" at message level but "ringing" at call level
    status: message.status ?? call.status,
    startedAt: message.startedAt ?? call.startedAt,
    endedAt: message.endedAt ?? call.endedAt,
    transcript: message.transcript ?? call.transcript,
    recordingUrl: message.recordingUrl ?? call.recordingUrl,
    endedReason: message.endedReason ?? call.endedReason,
    analysis: message.analysis ?? call.analysis,
    // Cost comes as a single number on message, but as array on call
    costs:
      call.costs ??
      (message.cost
        ? [{ amount: message.cost, description: "total" }]
        : undefined),
  };
}

/**
 * Format call info for logging
 *
 * @param call - VAPI call object
 * @returns Formatted log object
 */
export function formatCallForLog(
  call?: VapiWebhookCall,
): Record<string, unknown> {
  if (!call) return { callId: "unknown" };

  return {
    callId: call.id,
    type: call.type,
    status: call.status,
    assistantId: call.assistantId,
    customerNumber: call.customer?.number,
    phoneNumberId: call.phoneNumber?.id,
  };
}

/**
 * Format webhook message for logging
 *
 * @param messageType - Webhook message type
 * @param call - VAPI call object
 * @returns Formatted log object
 */
export function formatWebhookForLog(
  messageType: string,
  call?: VapiWebhookCall,
): Record<string, unknown> {
  return {
    type: messageType,
    ...formatCallForLog(call),
    timestamp: new Date().toISOString(),
  };
}

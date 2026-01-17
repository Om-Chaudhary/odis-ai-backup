/**
 * End of Call Report Handler
 *
 * Main entry point for end-of-call-report webhook events.
 * Routes to appropriate processor (inbound or outbound) based on call type.
 *
 * @module vapi/webhooks/handlers/end-of-call-report/handler
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import type {
  EndOfCallReportMessage,
  VapiWebhookCall,
  WebhookHandlerContext,
} from "../../types";
import { enrichCallFromMessage, getCallTableName } from "../../utils";
import {
  createInboundCallRecord,
  fetchExistingCall,
} from "../inbound-call-helpers";
import { handleInboundCallEnd } from "./inbound-processor";
import { handleOutboundCallEnd } from "./outbound-processor";

const logger = loggers.webhook.child("end-of-call-report");

/**
 * Handle end-of-call-report webhook
 *
 * Main dispatcher for end-of-call reports. Enriches the call data,
 * finds or creates the call record, and routes to the appropriate
 * processor based on call direction.
 *
 * @param message - End of call report message from VAPI
 * @param context - Handler context with isInbound flag
 * @param supabase - Supabase client for database operations
 */
export async function handleEndOfCallReport(
  message: EndOfCallReportMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<void> {
  const { call } = message;
  const { isInbound } = context;

  if (!call?.id) {
    logger.warn("End-of-call report missing call data", {
      messageType: message.type,
      isInbound,
    });
    return;
  }

  // Enrich call with message-level fields
  const enrichedCall = enrichCallFromMessage(call, message);

  // Log the complete call payload for debugging
  logCallDetails(call, message, enrichedCall, isInbound);

  const tableName = getCallTableName(isInbound);

  // Find existing call record
  let existingCall = await fetchExistingCall(call.id, tableName, supabase);

  if (!existingCall) {
    // For inbound calls, create the record if it doesn't exist
    if (isInbound) {
      const newCallId = await createInboundCallRecord(enrichedCall, supabase);
      if (!newCallId) {
        logger.error("Failed to create inbound call record");
        return;
      }

      // Re-fetch the newly created call
      existingCall = await fetchExistingCall(call.id, tableName, supabase);
      if (!existingCall) {
        logger.error("Failed to fetch newly created call");
        return;
      }
    } else {
      logger.warn("Call not found in database for end-of-call report", {
        callId: call.id,
        table: tableName,
      });
      return;
    }
  }

  // Route to appropriate processor
  if (isInbound) {
    await handleInboundCallEnd(enrichedCall, message, existingCall, supabase);
  } else {
    await handleOutboundCallEnd(enrichedCall, message, existingCall, supabase);
  }
}

/**
 * Log call details for debugging
 *
 * Logs critical status/endedReason differences between message and call level.
 * This is key for debugging - VAPI sends "ended" at message level but may send
 * "ringing" at call level.
 */
function logCallDetails(
  call: VapiWebhookCall,
  message: EndOfCallReportMessage,
  enrichedCall: VapiWebhookCall,
  isInbound: boolean,
): void {
  logger.info("End-of-call-report webhook status check", {
    callId: call.id,
    isInbound,
    // Status comparison (the root cause of "stuck at ringing" bugs)
    messageStatus: (message as { status?: string }).status,
    callStatus: call.status,
    enrichedStatus: enrichedCall.status,
    // EndedReason comparison
    messageEndedReason: message.endedReason,
    callEndedReason: call.endedReason,
    enrichedEndedReason: enrichedCall.endedReason,
    // Data availability
    hasArtifact: !!message.artifact,
    hasStructuredOutputs: !!message.artifact?.structuredOutputs,
  });

  logger.debug("End-of-call-report full details", {
    callId: call.id,
    isInbound,
    messageLevel: {
      status: (message as { status?: string }).status,
      hasStartedAt: !!message.startedAt,
      hasEndedAt: !!message.endedAt,
      hasTranscript: !!message.transcript,
      hasRecordingUrl: !!message.recordingUrl,
      hasCost: !!message.cost,
      hasAnalysis: !!message.analysis,
      hasEndedReason: !!message.endedReason,
      endedReason: message.endedReason,
    },
    callLevel: {
      status: call.status,
      hasStartedAt: !!call.startedAt,
      hasEndedAt: !!call.endedAt,
      hasTranscript: !!call.transcript,
      hasMessages: !!call.messages,
      messagesCount: call.messages?.length ?? 0,
      hasRecordingUrl: !!call.recordingUrl,
      hasCosts: !!call.costs,
      costsCount: call.costs?.length ?? 0,
      hasAnalysis: !!call.analysis,
      endedReason: call.endedReason,
    },
    enrichedCall: {
      status: enrichedCall.status,
      hasStartedAt: !!enrichedCall.startedAt,
      hasEndedAt: !!enrichedCall.endedAt,
      hasTranscript: !!enrichedCall.transcript,
      hasRecordingUrl: !!enrichedCall.recordingUrl,
      hasCosts: !!enrichedCall.costs,
      endedReason: enrichedCall.endedReason,
    },
    hasArtifact: !!message.artifact,
  });
}

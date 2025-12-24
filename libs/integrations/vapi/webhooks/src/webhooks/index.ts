/**
 * VAPI Webhook Dispatcher
 *
 * Central entry point for handling all VAPI webhook events.
 * Routes incoming webhooks to appropriate handlers based on message type.
 *
 * @module vapi/webhooks
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { createServiceClient } from "@odis-ai/data-access/db/server";

// Import and register built-in tools on module load
import { registerBuiltInTools } from "./tools";

// Register built-in tools when this module is first imported
let toolsRegistered = false;
function ensureToolsRegistered(): void {
  if (!toolsRegistered) {
    registerBuiltInTools();
    toolsRegistered = true;
  }
}

// Types
import type {
  AssistantRequestResponse,
  AssistantRequestTransferResponse,
  ToolCallsResponse,
  TransferDestinationResponse,
  VapiWebhookMessage,
  VapiWebhookMessageType,
  VapiWebhookPayload,
  WebhookHandlerContext,
  WebhookResponse,
} from "./types";

// Handlers
import {
  handleAssistantRequest,
  handleConversationUpdate,
  handleEndOfCallReport,
  handleFunctionCall,
  handleHang,
  handleModelOutput,
  handleSpeechUpdate,
  handleStatusUpdate,
  handleToolCalls,
  handleTranscript,
  handleTransferDestinationRequest,
  handleTransferUpdate,
} from "./handlers";

// Utils
import { formatWebhookForLog } from "./utils";

// Type guards
import {
  isAssistantRequestMessage,
  isConversationUpdateMessage,
  isEndOfCallReportMessage,
  isFunctionCallMessage,
  isHangMessage,
  isModelOutputMessage,
  isSpeechUpdateMessage,
  isStatusUpdateMessage,
  isToolCallsMessage,
  isTranscriptMessage,
  isTransferDestinationRequestMessage,
  isTransferUpdateMessage,
} from "./types";

const logger = loggers.webhook.child("vapi");

/**
 * Response types from webhook handlers
 */
export type WebhookHandlerResponse =
  | WebhookResponse
  | ToolCallsResponse
  | AssistantRequestResponse
  | AssistantRequestTransferResponse
  | TransferDestinationResponse
  | { result: unknown }
  | void;

/**
 * Parse and validate webhook payload
 *
 * @param body - Raw request body string
 * @returns Parsed payload or null if invalid
 */
export function parseWebhookPayload(body: string): VapiWebhookPayload | null {
  if (!body) {
    logger.warn("Empty webhook payload received");
    return null;
  }

  try {
    const payload = JSON.parse(body) as VapiWebhookPayload;

    if (!payload.message || typeof payload.message !== "object") {
      logger.warn("Invalid webhook payload structure", { payload });
      return null;
    }

    return payload;
  } catch (error) {
    logger.error("Invalid JSON in webhook payload", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Handle incoming VAPI webhook
 *
 * Main entry point for webhook processing. Routes to appropriate
 * handler based on message type.
 *
 * @param payload - Parsed webhook payload
 * @param supabase - Optional Supabase client (created if not provided)
 * @returns Handler response
 */
export async function handleVapiWebhook(
  payload: VapiWebhookPayload,
  supabase?: SupabaseClient,
): Promise<WebhookHandlerResponse> {
  // Ensure tools are registered before processing webhooks
  ensureToolsRegistered();

  const { message } = payload;

  // Get or create Supabase client
  const db = supabase ?? (await createServiceClient());

  // Determine call direction
  const call = (message as { call?: { type?: string } }).call;
  const isInbound = call?.type === "inboundPhoneCall";

  // Create handler context
  const context: WebhookHandlerContext = {
    isInbound,
    rawPayload: payload,
  };

  logger.info(
    "Received webhook event",
    formatWebhookForLog(message.type, call as never),
  );

  // Route to appropriate handler based on message type
  return routeToHandler(message, context, db);
}

/**
 * Route message to appropriate handler
 */
async function routeToHandler(
  message: VapiWebhookMessage,
  context: WebhookHandlerContext,
  supabase: SupabaseClient,
): Promise<WebhookHandlerResponse> {
  // Status update
  if (isStatusUpdateMessage(message)) {
    await handleStatusUpdate(message, context, supabase);
    return { success: true, message: "Status update processed" };
  }

  // End of call report
  if (isEndOfCallReportMessage(message)) {
    await handleEndOfCallReport(message, context, supabase);
    return { success: true, message: "End of call report processed" };
  }

  // Hang/hangup
  if (isHangMessage(message)) {
    await handleHang(message, context, supabase);
    return { success: true, message: "Hangup processed" };
  }

  // Tool calls (requires synchronous response with results)
  if (isToolCallsMessage(message)) {
    return handleToolCalls(message);
  }

  // Transcript
  if (isTranscriptMessage(message)) {
    await handleTranscript(message, context, supabase);
    return { success: true, message: "Transcript processed" };
  }

  // Speech update
  if (isSpeechUpdateMessage(message)) {
    await handleSpeechUpdate(message, context);
    return { success: true, message: "Speech update processed" };
  }

  // Assistant request (requires synchronous response with assistant config)
  if (isAssistantRequestMessage(message)) {
    return handleAssistantRequest(message, supabase);
  }

  // Transfer update
  if (isTransferUpdateMessage(message)) {
    await handleTransferUpdate(message, context, supabase);
    return { success: true, message: "Transfer update processed" };
  }

  // Transfer destination request (requires synchronous response with destination)
  if (isTransferDestinationRequestMessage(message)) {
    return handleTransferDestinationRequest(message, supabase);
  }

  // Conversation update
  if (isConversationUpdateMessage(message)) {
    await handleConversationUpdate(message, context);
    return { success: true, message: "Conversation update processed" };
  }

  // Model output
  if (isModelOutputMessage(message)) {
    await handleModelOutput(message, context);
    return { success: true, message: "Model output processed" };
  }

  // Function call (legacy format)
  if (isFunctionCallMessage(message)) {
    return handleFunctionCall(message);
  }

  // Unknown message type
  logger.warn("Unhandled message type", {
    type: message.type,
  });

  return { success: true, message: `Unhandled message type: ${message.type}` };
}

/**
 * Check if a response requires special handling
 * (i.e., needs to be returned directly to VAPI)
 */
export function requiresSynchronousResponse(
  messageType: VapiWebhookMessageType,
): boolean {
  const synchronousTypes: VapiWebhookMessageType[] = [
    "tool-calls",
    "assistant-request",
    "transfer-destination-request",
    "function-call",
  ];

  return synchronousTypes.includes(messageType);
}

// Re-export types for convenience
export * from "./types";
export * from "./utils";
export * from "./handlers";
export * from "./tools";

/**
 * VAPI Webhook Route
 *
 * Next.js API route handler for VAPI webhook events.
 * Delegates all processing to the modular webhook dispatcher.
 *
 * Supported Events:
 * - status-update: Call status changes
 * - end-of-call-report: Comprehensive call data at end
 * - hang: Call termination
 * - tool-calls: Server-side tool execution
 * - transcript: Real-time transcription
 * - speech-update: Speech detection
 * - assistant-request: Dynamic assistant selection
 * - transfer-update: Call transfer notifications
 * - transfer-destination-request: Transfer destination requests
 * - conversation-update: Conversation state changes
 * - model-output: LLM responses
 * - function-call: Legacy function calls
 *
 * @see https://docs.vapi.ai/server_url
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { loggers } from "@odis-ai/shared/logger";
// eslint-disable-next-line @nx/enforce-module-boundaries -- vapi lib used in webhook route
import {
  handleVapiWebhook,
  parseWebhookPayload,
} from "@odis-ai/integrations/vapi/webhooks";
import {
  handleCorsPreflightRequest,
  withCorsHeaders,
} from "@odis-ai/data-access/api/cors";

const logger = loggers.webhook.child("vapi-route");

/**
 * Handle incoming webhook from VAPI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.text();

    // Log raw webhook receipt for diagnostics
    logger.info("Webhook received", {
      timestamp: new Date().toISOString(),
      contentLength: body.length,
      userAgent: request.headers.get("user-agent"),
    });

    // Validate and parse payload
    const payload = parseWebhookPayload(body);

    if (!payload) {
      logger.warn("Invalid webhook payload", {
        bodyLength: body.length,
        bodyPreview: body.substring(0, 200),
      });
      return withCorsHeaders(
        request,
        NextResponse.json({ error: "Invalid payload" }, { status: 400 }),
      );
    }

    // Extract call info for detailed logging
    const call = (
      payload.message as {
        call?: { id?: string; type?: string; assistantId?: string };
      }
    ).call;
    const isInbound = call?.type === "inboundPhoneCall";

    logger.info("Webhook parsed successfully", {
      messageType: payload.message.type,
      callId: call?.id,
      callType: call?.type,
      assistantId: call?.assistantId,
      isInbound,
    });

    // Handle the webhook using the modular dispatcher
    const response = await handleVapiWebhook(payload);

    // Log completion for inbound calls specifically
    if (isInbound && payload.message.type === "end-of-call-report") {
      logger.info("Inbound end-of-call-report processed", {
        callId: call?.id,
        assistantId: call?.assistantId,
        responseSuccess: (response as { success?: boolean })?.success,
      });
    }

    // Return appropriate response with CORS headers
    return withCorsHeaders(
      request,
      NextResponse.json(response ?? { success: true }),
    );
  } catch (error) {
    logger.logError("Webhook processing failed", error as Error);

    return withCorsHeaders(
      request,
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}

/**
 * CORS preflight handler
 */
export function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "VAPI webhook endpoint is active",
    supportedEvents: [
      "status-update",
      "end-of-call-report",
      "hang",
      "tool-calls",
      "transcript",
      "speech-update",
      "assistant-request",
      "transfer-update",
      "transfer-destination-request",
      "conversation-update",
      "model-output",
      "function-call",
    ],
  });
}

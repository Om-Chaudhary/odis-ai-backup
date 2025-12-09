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
import { loggers } from "@odis/logger";
import { handleVapiWebhook, parseWebhookPayload } from "@odis/vapi/webhooks";

const logger = loggers.webhook.child("vapi-route");

/**
 * Handle incoming webhook from VAPI
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.text();

    // Validate and parse payload
    const payload = parseWebhookPayload(body);

    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Handle the webhook using the modular dispatcher
    const response = await handleVapiWebhook(payload);

    // Return appropriate response
    return NextResponse.json(response ?? { success: true });
  } catch (error) {
    logger.logError("Webhook processing failed", error as Error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
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

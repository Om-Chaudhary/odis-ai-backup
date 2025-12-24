/**
 * Slack Interactions Webhook
 *
 * Handles all interactive component events from Slack (buttons, modals, etc.)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  verifySlackRequest,
  ensureSlackClientInitialized,
} from "@odis-ai/integrations/slack";
import { handleInteraction } from "@odis-ai/integrations/slack/webhooks";
import { createServiceClient } from "@odis-ai/data-access/db/server";

/**
 * POST /api/slack/webhooks/interactions
 *
 * Slack sends interactions as application/x-www-form-urlencoded
 * with a "payload" field containing JSON.
 */
export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify Slack signature
    const isValid = verifySlackRequest(rawBody, request.headers);
    if (!isValid) {
      console.warn("[SLACK_WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse form data
    const formData = new URLSearchParams(rawBody);
    const payloadJson = formData.get("payload");

    if (!payloadJson) {
      console.error("[SLACK_WEBHOOK] No payload in request");
      return NextResponse.json({ error: "No payload found" }, { status: 400 });
    }

    // Parse JSON payload
    let payload: unknown;
    try {
      payload = JSON.parse(payloadJson);
    } catch (error) {
      console.error("[SLACK_WEBHOOK] Invalid JSON in payload", {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: "Invalid payload JSON" },
        { status: 400 },
      );
    }

    // Initialize Slack client (idempotent)
    ensureSlackClientInitialized();

    // Create Supabase service client (bypasses RLS)
    const supabase = await createServiceClient();

    // Handle the interaction
    const result = await handleInteraction(payload, supabase);

    if (!result.ok) {
      // Check if there are validation errors to return to Slack
      if (result.response) {
        return NextResponse.json(result.response);
      }

      console.error("[SLACK_WEBHOOK] Interaction handler failed", {
        error: result.error,
      });

      // Return 200 to Slack even on error to prevent retries
      // We've already logged the error
      return NextResponse.json({ ok: false });
    }

    // Success - Slack expects 200 OK
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SLACK_WEBHOOK] Unexpected error in POST handler", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 200 to prevent Slack retries on our internal errors
    return NextResponse.json({ ok: false });
  }
}

/**
 * Slack may send a URL verification challenge on first setup
 * This is typically only for Events API, but we handle it just in case
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

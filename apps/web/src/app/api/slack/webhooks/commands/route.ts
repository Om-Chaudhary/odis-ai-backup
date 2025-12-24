/**
 * Slack Slash Commands Webhook
 *
 * Handles POST requests from Slack slash commands (/checklist).
 * Verifies signatures, parses payloads, and routes to command handlers.
 */

import { NextResponse } from "next/server";
import {
  verifySlackRequest,
  slashCommandPayloadSchema,
  routeCommand,
  ensureSlackClientInitialized,
  type CommandContext,
  type SlashCommandPayloadInput,
} from "@odis-ai/integrations/slack";

/**
 * Parse form-encoded Slack payload
 */
function parseFormBody(body: string): SlashCommandPayloadInput {
  const params = new URLSearchParams(body);
  const payload: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  return slashCommandPayloadSchema.parse(payload);
}

/**
 * Convert Slack payload to CommandContext
 */
function buildContext(payload: SlashCommandPayloadInput): CommandContext {
  return {
    teamId: payload.team_id,
    channelId: payload.channel_id,
    channelName: payload.channel_name,
    userId: payload.user_id,
    userName: payload.user_name,
    triggerId: payload.trigger_id,
    responseUrl: payload.response_url,
  };
}

/**
 * POST /api/slack/webhooks/commands
 *
 * Slack sends slash commands as application/x-www-form-urlencoded
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify Slack signature
    if (!verifySlackRequest(rawBody, request.headers)) {
      console.warn("[SLACK_COMMANDS_WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse and validate payload
    let payload: SlashCommandPayloadInput;
    try {
      payload = parseFormBody(rawBody);
    } catch (error) {
      console.error("[SLACK_COMMANDS_WEBHOOK] Invalid payload format", {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log("[SLACK_COMMANDS_WEBHOOK] Command received", {
      command: payload.command,
      text: payload.text,
      userId: payload.user_id,
      channelId: payload.channel_id,
    });

    // Initialize Slack client (idempotent - needed for modal opening)
    ensureSlackClientInitialized();

    // Build context and route command
    const context = buildContext(payload);
    const response = await routeCommand(payload.text, context);

    // Return response to Slack
    // Slack expects 200 OK with JSON body
    return NextResponse.json({
      response_type: response.responseType ?? "ephemeral",
      text: response.text,
      blocks: response.blocks,
    });
  } catch (error) {
    console.error("[SLACK_COMMANDS_WEBHOOK] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        response_type: "ephemeral",
        text: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    );
  }
}

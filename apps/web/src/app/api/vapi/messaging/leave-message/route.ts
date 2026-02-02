/**
 * VAPI Leave Message Tool
 *
 * POST /api/vapi/messaging/leave-message
 *
 * Records callback messages when callers need staff follow-up.
 * Supports message categorization and urgency flags.
 *
 * @deprecated This HTTP endpoint is deprecated. Configure VAPI tools to use the
 * webhook tool-calls endpoint instead (/api/webhooks/vapi). The tool registry
 * handles all tool execution automatically with proper clinic context.
 */

import { type NextRequest, NextResponse } from "next/server";
import { loggers } from "@odis-ai/shared/logger";

const deprecationLogger = loggers.vapi.child("deprecated-http");

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { LeaveMessageSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processLeaveMessage } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "leave-message",
    schema: LeaveMessageSchema,
    processor: processLeaveMessage,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/messaging/leave-message",
    recommendation: "Configure VAPI to use webhook tool-calls instead",
  });

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!cachedHandler) {
    cachedHandler = await getHandler();
  }
  return cachedHandler.POST(request);
}

export async function OPTIONS(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!cachedHandler) {
    cachedHandler = await getHandler();
  }
  return cachedHandler.OPTIONS(request);
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    tool: "leave-message",
    endpoint: "/api/vapi/messaging/leave-message",
    required: ["client_name", "client_phone", "message"],
    optional: [
      "pet_name",
      "is_urgent",
      "message_type",
      "best_callback_time",
      "notes",
    ],
    message_types: [
      "general",
      "billing",
      "records",
      "refill",
      "clinical",
      "other",
    ],
  });
}

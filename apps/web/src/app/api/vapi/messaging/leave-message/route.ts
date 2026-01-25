/**
 * VAPI Leave Message Tool
 *
 * POST /api/vapi/messaging/leave-message
 *
 * Records callback messages when callers need staff follow-up.
 * Supports message categorization and urgency flags.
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { LeaveMessageSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processLeaveMessage } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "leave-message",
    schema: LeaveMessageSchema,
    processor: processLeaveMessage,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
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

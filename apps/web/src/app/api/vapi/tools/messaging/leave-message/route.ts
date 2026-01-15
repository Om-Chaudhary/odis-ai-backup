/**
 * VAPI Leave Message Tool
 *
 * POST /api/vapi/tools/messaging/leave-message
 */

import { type NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  const handler = await getHandler();
  return handler.POST(request);
}

export async function OPTIONS(request: NextRequest) {
  const handler = await getHandler();
  return handler.OPTIONS(request);
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    tool: "leave-message",
    endpoint: "/api/vapi/tools/messaging/leave-message",
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

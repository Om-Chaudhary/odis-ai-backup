/**
 * VAPI Leave Message Tool
 *
 * POST /api/vapi/tools/messaging/leave-message
 */

import { NextResponse } from "next/server";
import { createToolHandler } from "@odis-ai/integrations/vapi/core";
import { LeaveMessageSchema } from "@odis-ai/integrations/vapi/schemas";
import { processLeaveMessage } from "@odis-ai/integrations/vapi/processors";

const handler = createToolHandler({
  name: "leave-message",
  schema: LeaveMessageSchema,
  processor: processLeaveMessage,
});

export const { POST, OPTIONS } = handler;

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

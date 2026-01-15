/**
 * VAPI Log Emergency Triage Tool
 *
 * POST /api/vapi/tools/triage/log-emergency
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { LogEmergencyTriageSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processLogEmergencyTriage } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "log-emergency-triage",
    schema: LogEmergencyTriageSchema,
    processor: processLogEmergencyTriage,
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
    tool: "log-emergency-triage",
    endpoint: "/api/vapi/tools/triage/log-emergency",
    required: [
      "caller_name",
      "caller_phone",
      "pet_name",
      "symptoms",
      "urgency",
      "action_taken",
    ],
    optional: ["species", "er_referred", "notes"],
    urgency_levels: ["critical", "urgent", "monitor"],
    action_types: ["sent_to_er", "scheduled_appointment", "home_care_advised"],
  });
}

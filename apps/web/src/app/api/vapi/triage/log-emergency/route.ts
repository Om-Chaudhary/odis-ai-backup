/**
 * VAPI Log Emergency Triage Tool
 *
 * POST /api/vapi/triage/log-emergency
 *
 * Records emergency triage decisions when callers report urgent symptoms.
 * Logs symptoms, urgency level, and actions taken (ER referral, appointment, home care).
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { LogEmergencyTriageSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processLogEmergencyTriage } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "log-emergency-triage",
    schema: LogEmergencyTriageSchema,
    processor: processLogEmergencyTriage,
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
    tool: "log-emergency-triage",
    endpoint: "/api/vapi/triage/log-emergency",
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

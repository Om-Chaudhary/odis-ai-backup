/**
 * VAPI Log Emergency Triage Tool
 *
 * POST /api/vapi/tools/triage/log-emergency
 */

import { NextResponse } from "next/server";
import { createToolHandler } from "@odis-ai/integrations/vapi/core";
import { LogEmergencyTriageSchema } from "@odis-ai/integrations/vapi/schemas";
import { processLogEmergencyTriage } from "@odis-ai/integrations/vapi/processors";

const handler = createToolHandler({
  name: "log-emergency-triage",
  schema: LogEmergencyTriageSchema,
  processor: processLogEmergencyTriage,
});

export const { POST, OPTIONS } = handler;

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

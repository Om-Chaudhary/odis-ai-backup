/**
 * VAPI Check Availability Tool
 *
 * POST /api/vapi/tools/appointments/check-availability
 */

import { NextResponse } from "next/server";
import { createToolHandler } from "@odis-ai/integrations/vapi/core";
import { CheckAvailabilitySchema } from "@odis-ai/integrations/vapi/schemas";
import { processCheckAvailability } from "@odis-ai/integrations/vapi/processors";

const handler = createToolHandler({
  name: "check-availability",
  schema: CheckAvailabilitySchema,
  processor: processCheckAvailability,
});

export const { POST, OPTIONS } = handler;

export async function GET() {
  return NextResponse.json({
    status: "active",
    tool: "check-availability",
    endpoint: "/api/vapi/tools/appointments/check-availability",
    schema: "strict-iso-8601",
    example: { date: "2024-12-25" },
  });
}

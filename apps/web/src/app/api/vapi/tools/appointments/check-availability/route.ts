/**
 * VAPI Check Availability Tool
 *
 * POST /api/vapi/tools/appointments/check-availability
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { CheckAvailabilitySchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processCheckAvailability } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "check-availability",
    schema: CheckAvailabilitySchema,
    processor: processCheckAvailability,
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
    tool: "check-availability",
    endpoint: "/api/vapi/tools/appointments/check-availability",
    schema: "strict-iso-8601",
    example: { date: "2024-12-25" },
  });
}

/**
 * VAPI Check Availability Range Tool
 *
 * POST /api/vapi/appointments/check-range
 *
 * Checks appointment availability across a date range (up to 14 days).
 * Returns summary of available days and detailed times for the first available date.
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { CheckAvailabilityRangeSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processCheckAvailabilityRange } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "check-availability-range",
    schema: CheckAvailabilityRangeSchema,
    processor: processCheckAvailabilityRange,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  if (!cachedHandler) {
    cachedHandler = await getHandler();
  }
  return cachedHandler.POST(request);
}

export async function OPTIONS(request: NextRequest) {
  if (!cachedHandler) {
    cachedHandler = await getHandler();
  }
  return cachedHandler.OPTIONS(request);
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    tool: "check-availability-range",
    endpoint: "/api/vapi/appointments/check-range",
    description:
      "Checks appointment availability for a date range (up to 30 days)",
    optional_fields: ["assistant_id", "days_ahead", "start_date"],
    defaults: {
      days_ahead: 14,
      start_date: "today",
    },
  });
}

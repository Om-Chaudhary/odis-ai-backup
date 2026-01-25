/**
 * VAPI Check Availability Tool
 *
 * POST /api/vapi/appointments/check
 *
 * Checks available appointment slots for a specific date.
 * Returns available times formatted for voice response.
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { CheckAvailabilitySchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processCheckAvailability } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "check-availability",
    schema: CheckAvailabilitySchema,
    processor: processCheckAvailability,
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
    tool: "check-availability",
    endpoint: "/api/vapi/appointments/check",
    schema: "strict-iso-8601",
    example: { date: "2024-12-25" },
  });
}

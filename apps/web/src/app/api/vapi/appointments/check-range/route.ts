/**
 * VAPI Check Availability Range Tool
 *
 * POST /api/vapi/appointments/check-range
 *
 * Checks appointment availability across a date range (up to 14 days).
 * Returns summary of available days and detailed times for the first available date.
 *
 * @deprecated This HTTP endpoint is deprecated. Configure VAPI tools to use the
 * webhook tool-calls endpoint instead (/api/webhooks/vapi). The tool registry
 * handles all tool execution automatically with proper clinic context.
 */

import { type NextRequest, NextResponse } from "next/server";
import { loggers } from "@odis-ai/shared/logger";

const deprecationLogger = loggers.vapi.child("deprecated-http");

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { CheckAvailabilityRangeSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processCheckAvailabilityRange } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "check-availability-range",
    schema: CheckAvailabilityRangeSchema,
    processor: processCheckAvailabilityRange,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/appointments/check-range",
    recommendation: "Configure VAPI to use webhook tool-calls instead",
  });

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

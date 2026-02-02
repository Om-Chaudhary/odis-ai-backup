/**
 * VAPI Check Availability Tool
 *
 * POST /api/vapi/appointments/check
 *
 * Checks available appointment slots for a specific date.
 * Returns available times formatted for voice response.
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

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/appointments/check",
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
    tool: "check-availability",
    endpoint: "/api/vapi/appointments/check",
    schema: "strict-iso-8601",
    example: { date: "2024-12-25" },
  });
}

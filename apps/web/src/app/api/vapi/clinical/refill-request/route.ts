/**
 * VAPI Create Refill Request Tool
 *
 * POST /api/vapi/clinical/refill-request
 *
 * Creates a prescription refill request for veterinarian approval.
 * Stores requests in the refill_requests table with status='pending'.
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
  const { CreateRefillRequestSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processCreateRefillRequest } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "create-refill-request",
    schema: CreateRefillRequestSchema,
    processor: processCreateRefillRequest,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/clinical/refill-request",
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
    tool: "create-refill-request",
    endpoint: "/api/vapi/clinical/refill-request",
    required_fields: [
      "client_name",
      "client_phone",
      "pet_name",
      "medication_name",
    ],
    optional_fields: [
      "assistant_id",
      "clinic_id",
      "species",
      "medication_strength",
      "pharmacy_preference",
      "pharmacy_name",
      "last_refill_date",
      "notes",
      "vapi_call_id",
    ],
    pharmacy_preferences: ["pickup", "external_pharmacy"],
    statuses: ["pending", "approved", "denied", "dispensed"],
  });
}

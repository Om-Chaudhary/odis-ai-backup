/**
 * VAPI Create Refill Request Tool
 *
 * POST /api/vapi/clinical/refill-request
 *
 * Creates a prescription refill request for veterinarian approval.
 * Stores requests in the refill_requests table with status='pending'.
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { CreateRefillRequestSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processCreateRefillRequest } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "create-refill-request",
    schema: CreateRefillRequestSchema,
    processor: processCreateRefillRequest,
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

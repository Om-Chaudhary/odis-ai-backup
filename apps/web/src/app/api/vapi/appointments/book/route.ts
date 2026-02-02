/**
 * VAPI Book Appointment Tool
 *
 * POST /api/vapi/appointments/book
 *
 * Books an appointment using the PIMS-synced availability system.
 * Supports 5-minute hold, natural language date/time parsing, and alternative suggestions.
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
  const { BookAppointmentSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processBookAppointment } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "book-appointment",
    schema: BookAppointmentSchema,
    processor: processBookAppointment,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/appointments/book",
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
    tool: "book-appointment",
    endpoint: "/api/vapi/appointments/book",
    features: [
      "5-minute hold on booking",
      "Alternative times if slot unavailable",
      "Confirmation number generation",
      "Natural language date parsing",
      "Natural language time parsing",
    ],
    required: ["date", "time", "client_name", "client_phone", "patient_name"],
    optional: ["species", "breed", "reason", "is_new_client"],
  });
}

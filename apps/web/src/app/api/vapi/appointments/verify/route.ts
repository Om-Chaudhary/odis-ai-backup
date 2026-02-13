/**
 * VAPI Verify Appointment Tool
 *
 * POST /api/vapi/appointments/verify
 *
 * Verifies that an appointment exists for a given patient on a given date.
 * Queries local synced data (not live IDEXX). Used by cancel/reschedule tools.
 *
 * @deprecated This HTTP endpoint is deprecated. Configure VAPI tools to use the
 * webhook tool-calls endpoint instead (/api/webhooks/vapi). The tool registry
 * handles all tool execution automatically with proper clinic context.
 */

import { type NextRequest, NextResponse } from "next/server";
import { loggers } from "@odis-ai/shared/logger";

const deprecationLogger = loggers.vapi.child("deprecated-http");

async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { VerifyAppointmentSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processVerifyAppointment } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "verify-appointment",
    schema: VerifyAppointmentSchema,
    processor: processVerifyAppointment,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/appointments/verify",
    recommendation: "Configure VAPI to use webhook tool-calls instead",
  });

  cachedHandler ??= await getHandler();
  return cachedHandler.POST(request);
}

export async function OPTIONS(request: NextRequest) {
  cachedHandler ??= await getHandler();
  return cachedHandler.OPTIONS(request);
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    tool: "verify-appointment",
    endpoint: "/api/vapi/appointments/verify",
    description: "Verifies appointment exists in local synced data",
    features: [
      "Queries pims_appointments (IDEXX sync)",
      "Falls back to appointment_bookings (recent AI bookings)",
      "Natural language date parsing",
      "Fast (no IDEXX API calls)",
    ],
    required: ["owner_name", "patient_name", "appointment_date"],
    optional: ["assistant_id", "clinic_id", "vapi_call_id"],
  });
}

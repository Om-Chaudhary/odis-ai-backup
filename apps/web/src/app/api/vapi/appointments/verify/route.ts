/**
 * VAPI Verify Appointment Tool
 *
 * POST /api/vapi/appointments/verify
 *
 * Verifies that an appointment exists for a given patient on a given date.
 * Queries local synced data (not live IDEXX). Used by cancel/reschedule tools.
 */

import { type NextRequest, NextResponse } from "next/server";

async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { VerifyAppointmentSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processVerifyAppointment } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "verify-appointment",
    schema: VerifyAppointmentSchema,
    processor: processVerifyAppointment,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
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
      "Queries schedule_appointments (IDEXX sync)",
      "Falls back to vapi_bookings (recent AI bookings)",
      "Natural language date parsing",
      "Fast (no IDEXX API calls)",
    ],
    required: ["owner_name", "patient_name", "appointment_date"],
    optional: ["assistant_id", "clinic_id", "vapi_call_id"],
  });
}

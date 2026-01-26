/**
 * VAPI Cancel Appointment Tool
 *
 * POST /api/vapi/appointments/cancel
 *
 * Cancels an existing appointment with explicit verbal consent.
 * Two-step process: First verifies, then cancels with confirmed=true.
 */

import { type NextRequest, NextResponse } from "next/server";

async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { CancelAppointmentSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processCancelAppointment } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "cancel-appointment",
    schema: CancelAppointmentSchema,
    processor: processCancelAppointment,
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
    tool: "cancel-appointment",
    endpoint: "/api/vapi/appointments/cancel",
    description: "Cancels appointment with explicit consent",
    features: [
      "Two-step consent flow",
      "Updates local database immediately",
      "Queues IDEXX cancellation job",
      "Audit logging",
    ],
    required: ["client_name", "client_phone", "pet_name", "appointment_date"],
    optional: ["appointment_time", "reason", "confirmed"],
    consent: "Set confirmed=true after obtaining verbal consent",
  });
}

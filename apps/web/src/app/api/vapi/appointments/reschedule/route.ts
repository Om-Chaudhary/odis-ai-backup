/**
 * VAPI Reschedule Appointment Tool
 *
 * POST /api/vapi/appointments/reschedule
 *
 * Atomically reschedules an existing appointment to a new date/time.
 * Two-step process: First verifies + checks availability, then reschedules with confirmed=true.
 *
 * ATOMIC GUARANTEE: Caller never ends up without an appointment.
 * If new appointment creation fails, original is restored.
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
  const { RescheduleAppointmentSchema } =
    await import("@odis-ai/integrations/vapi/schemas");
  const { processRescheduleAppointment } =
    await import("@odis-ai/integrations/vapi/processors");

  return createToolHandler({
    name: "reschedule-appointment",
    schema: RescheduleAppointmentSchema,
    processor: processRescheduleAppointment,
  });
}

let cachedHandler: Awaited<ReturnType<typeof getHandler>> | null = null;

export async function POST(request: NextRequest) {
  deprecationLogger.warn("Deprecated HTTP endpoint called", {
    endpoint: "/api/vapi/appointments/reschedule",
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
    tool: "reschedule-appointment",
    endpoint: "/api/vapi/appointments/reschedule",
    description: "Atomically reschedules appointment with rollback support",
    features: [
      "Two-step consent flow",
      "Atomic transaction (cancel + create)",
      "Rollback on failure",
      "Alternative time suggestions",
      "Queues IDEXX reschedule job",
      "Audit logging",
    ],
    required: [
      "client_name",
      "client_phone",
      "pet_name",
      "original_date",
      "preferred_new_date",
    ],
    optional: ["original_time", "preferred_new_time", "reason", "confirmed"],
    consent: "Set confirmed=true after obtaining verbal consent",
    guarantee: "Original appointment preserved if reschedule fails",
  });
}

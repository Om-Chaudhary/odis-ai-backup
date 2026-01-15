/**
 * VAPI Book Appointment Tool
 *
 * POST /api/vapi/tools/appointments/book
 */

import { type NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  const handler = await getHandler();
  return handler.POST(request);
}

export async function OPTIONS(request: NextRequest) {
  const handler = await getHandler();
  return handler.OPTIONS(request);
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    tool: "book-appointment",
    endpoint: "/api/vapi/tools/appointments/book",
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

/**
 * VAPI Book Appointment Tool
 *
 * POST /api/vapi/appointments/book
 *
 * Books an appointment using the PIMS-synced availability system.
 * Supports 5-minute hold, natural language date/time parsing, and alternative suggestions.
 */

import { type NextRequest, NextResponse } from "next/server";

// Helper to load the handler dynamically
async function getHandler() {
  const { createToolHandler } = await import("@odis-ai/integrations/vapi/core");
  const { BookAppointmentSchema } = await import(
    "@odis-ai/integrations/vapi/schemas"
  );
  const { processBookAppointment } = await import(
    "@odis-ai/integrations/vapi/processors"
  );

  return createToolHandler({
    name: "book-appointment",
    schema: BookAppointmentSchema,
    processor: processBookAppointment,
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

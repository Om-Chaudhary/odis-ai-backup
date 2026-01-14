/**
 * VAPI Book Appointment Tool
 *
 * POST /api/vapi/tools/appointments/book
 */

import { NextResponse } from "next/server";
import { createToolHandler } from "@odis-ai/integrations/vapi/core";
import { BookAppointmentSchema } from "@odis-ai/integrations/vapi/schemas";
import { processBookAppointment } from "@odis-ai/integrations/vapi/processors";

const handler = createToolHandler({
  name: "book-appointment",
  schema: BookAppointmentSchema,
  processor: processBookAppointment,
});

export const { POST, OPTIONS } = handler;

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

/**
 * Appointment to Ingest Transformer
 *
 * Transforms IDEXX ScheduleAppointment data into the format expected
 * by the ODIS /api/cases/ingest endpoint.
 */

import type { IdexxAppointmentData, IdexxConsultationLine } from "../../types";

/**
 * Schedule appointment data structure
 * (Duplicated from schedule-extractor to avoid circular dependencies)
 */
export interface ScheduleAppointment {
  id: string;
  consultationId?: string | null;
  startTime: Date | null;
  duration: number | null;
  patient: {
    name: string | null;
    id: string | null;
    species: string | null;
    breed: string | null;
  };
  client: {
    name: string | null;
    id: string | null;
    phone: string | null;
    email: string | null;
  };
  provider: {
    name: string | null;
    id: string | null;
  };
  type: string | null;
  status: string | null;
  notes: string | null;
  reason: string | null;
  extractedFrom: "dom" | "api";
  rawElement?: HTMLElement;
}

/**
 * Consultation data extracted from IDEXX
 * This comes from fetchConsultationData()
 */
export interface ConsultationData {
  notes: string | null;
  productsServices: string | null;
  declinedProductsServices: string | null;
  status: string | null;
}

/**
 * Format consultation line items into a readable string
 * @param lines - Array of consultation line items
 * @param declinedOnly - If true, only return declined items
 * @returns Formatted string like "Product A; Product B (Qty: 2)"
 */
export const formatProductsServices = (
  lines: IdexxConsultationLine[] | undefined,
  declinedOnly: boolean,
): string => {
  if (!lines || lines.length === 0) {
    return "";
  }

  const filtered = lines.filter((line) =>
    declinedOnly ? line.isDeclined : !line.isDeclined,
  );

  if (filtered.length === 0) {
    return "";
  }

  return filtered
    .map((line) => {
      const parts = [line.productService];
      if (line.quantity && line.quantity !== 1) {
        parts.push(`(Qty: ${line.quantity})`);
      }
      return parts.join(" ");
    })
    .join("; ");
};

/**
 * Extract consultation data from the full consultation page data
 * Used to extract notes, products/services from fetchConsultationData() result
 */
export const extractConsultationData = (consultationPageData: {
  consultationNotes?: { notes?: string };
  consultation?: { notes?: string; status?: string };
  consultationLines?: IdexxConsultationLine[];
}): ConsultationData => {
  // Extract notes
  const notesData = consultationPageData.consultationNotes as
    | { notes?: string }
    | undefined;
  const notes =
    notesData?.notes || consultationPageData.consultation?.notes || null;

  // Extract products/services
  const productsServices =
    formatProductsServices(consultationPageData.consultationLines, false) ||
    null;
  const declinedProductsServices =
    formatProductsServices(consultationPageData.consultationLines, true) ||
    null;

  // Extract status
  const status = consultationPageData.consultation?.status || null;

  return {
    notes,
    productsServices,
    declinedProductsServices,
    status,
  };
};

/**
 * Transform a ScheduleAppointment to the ODIS ingest format
 *
 * @param appointment - ScheduleAppointment from IDEXX
 * @param consultation - Optional consultation data (notes, products/services)
 * @returns IdexxAppointmentData for /api/cases/ingest
 */
export const transformToIngestPayload = (
  appointment: ScheduleAppointment,
  consultation?: ConsultationData,
): IdexxAppointmentData => {
  // Format date as YYYY-MM-DD
  const appointmentDate = appointment.startTime
    ? appointment.startTime.toISOString().split("T")[0]
    : undefined;

  // Format time as HH:MM
  const appointmentTime = appointment.startTime
    ? appointment.startTime.toTimeString().slice(0, 5) // "14:30"
    : undefined;

  return {
    // Identifiers
    appointmentId: appointment.id,
    consultationId: appointment.consultationId ?? undefined,

    // Patient info
    pet_name: appointment.patient.name || "Unknown",
    species: appointment.patient.species ?? undefined,
    breed: appointment.patient.breed ?? undefined,

    // Owner info
    owner_name: appointment.client.name ?? undefined,
    phone_number: appointment.client.phone ?? undefined,
    email: appointment.client.email ?? undefined,

    // Clinical data (from consultation fetch)
    consultation_notes: consultation?.notes ?? undefined,
    products_services: consultation?.productsServices ?? undefined,
    declined_products_services:
      consultation?.declinedProductsServices ?? undefined,

    // Appointment details
    appointment_type: appointment.type ?? undefined,
    appointment_date: appointmentDate,
    appointment_time: appointmentTime,
    provider_name: appointment.provider.name ?? undefined,
    provider_id: appointment.provider.id ?? undefined,

    // Additional metadata
    appointment_status: appointment.status ?? undefined,
    appointment_duration: appointment.duration ?? undefined,
    appointment_reason: appointment.reason ?? undefined,
    notes: appointment.notes ?? undefined,
  };
};

"use client";

import { CalendarX } from "lucide-react";
import { format } from "date-fns";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
  EditorialStatusBadge,
  type FieldItem,
} from "./editorial";

interface CanceledAppointmentCardProps {
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** Fallback: Summary of the cancellation from VAPI */
  outcomeSummary?: string;
  /** Fallback: Pet name if available */
  petName?: string | null;
  /** Fallback: Reason for cancellation if provided */
  cancellationReason?: string | null;
  /** Additional className */
  className?: string;
}

/**
 * Canceled Appointment Card (Editorial Design)
 *
 * Displays cancellation information from vapi_bookings with
 * magazine-style editorial layout and key-value pairs.
 */
export function CanceledAppointmentCard({
  booking,
  outcomeSummary,
  petName,
  cancellationReason,
  className,
}: CanceledAppointmentCardProps) {
  // Format date for display (YYYY-MM-DD -> Jan 19, 2025)
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Format patient display (name + species)
  const formatPatient = (): string | null => {
    if (booking?.patient_name) {
      const species = booking.species
        ? ` (${booking.species.charAt(0).toUpperCase() + booking.species.slice(1)})`
        : "";
      return `${booking.patient_name}${species}`;
    }
    return petName ?? null;
  };

  // Build field items for structured display
  const fields: FieldItem[] = [
    {
      label: "Patient",
      value: formatPatient(),
    },
    {
      label: "Date",
      value: booking?.date ? formatDate(booking.date) : null,
    },
    {
      label: "Reason",
      value: booking?.rescheduled_reason ?? cancellationReason ?? null,
    },
  ];

  // If no booking data, show fallback summary
  if (!booking) {
    return (
      <EditorialCardBase variant="canceled" className={className}>
        <EditorialHeader
          titleLine1="Appointment"
          titleLine2="Canceled"
          icon={CalendarX}
          variant="canceled"
        />

        {outcomeSummary && (
          <div className="px-5 pb-4">
            <div className="h-px bg-border/60 mb-3" />
            <p className="text-sm leading-relaxed text-slate-700">
              {outcomeSummary}
            </p>
          </div>
        )}

        <EditorialStatusBadge
          text="Cancellation Logged"
          showCheck
          variant="canceled"
        />
      </EditorialCardBase>
    );
  }

  return (
    <EditorialCardBase variant="canceled" className={className}>
      <EditorialHeader
        titleLine1="Appointment"
        titleLine2="Canceled"
        icon={CalendarX}
        variant="canceled"
      />

      <EditorialFieldList
        sectionLabel="Cancellation Details"
        fields={fields}
        variant="canceled"
      />

      <EditorialStatusBadge
        text="Cancellation Logged"
        showCheck
        variant="canceled"
      />
    </EditorialCardBase>
  );
}

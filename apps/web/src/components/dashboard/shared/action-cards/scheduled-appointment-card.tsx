"use client";

import { CalendarCheck } from "lucide-react";
import { format, parse } from "date-fns";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
  EditorialActionButton,
  type FieldItem,
} from "./editorial";

interface ScheduledAppointmentCardProps {
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** Fallback: Summary of the scheduled appointment from VAPI */
  outcomeSummary?: string;
  /** Fallback: Pet name if available */
  petName?: string | null;
  /** Callback when confirm is clicked */
  onConfirm?: () => void;
  /** Whether confirm action is in progress */
  isConfirming?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Scheduled Appointment Card (Editorial Design)
 *
 * Displays structured appointment data from vapi_bookings with
 * magazine-style editorial layout and key-value pairs.
 */
export function ScheduledAppointmentCard({
  booking,
  outcomeSummary,
  petName,
  onConfirm,
  isConfirming,
  className,
}: ScheduledAppointmentCardProps) {
  // Format time for display (HH:MM:SS -> h:mm a)
  const formatTime = (time: string): string => {
    try {
      const parsed = parse(time, "HH:mm:ss", new Date());
      return format(parsed, "h:mm a");
    } catch {
      return time;
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

  // Parse appointment date
  const appointmentDate = booking?.date ? new Date(booking.date) : new Date();

  // Format date for display
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  // Build field items for structured display
  const fields: FieldItem[] = [
    {
      label: "Name",
      value: formatPatient(),
    },
    {
      label: "Reason",
      value: booking?.reason ?? null,
    },
    {
      label: "Date",
      value: booking?.date ? formatDate(booking.date) : null,
    },
    {
      label: "Time",
      value: booking?.start_time ? formatTime(booking.start_time) : null,
    },
  ];

  // If no booking data, show fallback summary
  if (!booking) {
    return (
      <EditorialCardBase variant="scheduled" className={className}>
        <EditorialHeader
          titleLine1="Appointment"
          titleLine2="Scheduled"
          icon={CalendarCheck}
          variant="scheduled"
        />

        {outcomeSummary && (
          <div className="px-5 pb-4">
            <div className="h-px bg-border/60 mb-3" />
            <p className="text-sm leading-relaxed text-slate-700">
              {outcomeSummary}
            </p>
          </div>
        )}

        {onConfirm && (
          <EditorialActionButton
            label="Confirm"
            dateOrText={format(new Date(), "MM.dd.yyyy")}
            onClick={onConfirm}
            isLoading={isConfirming}
            variant="scheduled"
          />
        )}
      </EditorialCardBase>
    );
  }

  return (
    <EditorialCardBase variant="scheduled" className={className}>
      <EditorialHeader
        titleLine1="Appointment"
        titleLine2="Scheduled"
        icon={CalendarCheck}
        variant="scheduled"
      />

      <EditorialFieldList
        sectionLabel="Patient Details"
        fields={fields}
        variant="scheduled"
      />

      {onConfirm && (
        <EditorialActionButton
          label="Confirm"
          dateOrText={appointmentDate}
          onClick={onConfirm}
          isLoading={isConfirming}
          variant="scheduled"
        />
      )}
    </EditorialCardBase>
  );
}

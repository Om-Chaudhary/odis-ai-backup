"use client";

import { CalendarCheck } from "lucide-react";
import { format, parse } from "date-fns";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
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
  /** Whether the action has been confirmed */
  isConfirmed?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Format time for display (HH:MM:SS -> h:mm a)
 */
function formatTime(time: string): string {
  try {
    const parsed = parse(time, "HH:mm:ss", new Date());
    return format(parsed, "h:mm a");
  } catch {
    return time;
  }
}

/**
 * Format date for display (YYYY-MM-DD -> MMM d)
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, "MMM d");
  } catch {
    return dateStr;
  }
}

/**
 * Scheduled Appointment Card
 *
 * Editorial design with:
 * - Green gradient background
 * - Calendar icon with notification dots
 * - Date/time in teal
 * - Reason in quotes
 * - Large green confirm button
 */
export function ScheduledAppointmentCard({
  booking,
  outcomeSummary,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: ScheduledAppointmentCardProps) {
  // Build date/time string (e.g., "Jan 25, 9:30 AM")
  const dateTimeStr =
    booking?.date && booking?.start_time
      ? `${formatDate(booking.date)},  ${formatTime(booking.start_time)}`
      : booking?.date
        ? formatDate(booking.date)
        : null;

  // Get reason text
  const reason = booking?.reason ?? outcomeSummary ?? null;

  return (
    <EditorialCardBase variant="scheduled" className={className}>
      <EditorialHeader
        title="Appointment Scheduled"
        icon={CalendarCheck}
        variant="scheduled"
        showNotificationDots
      />

      <EditorialFieldList
        variant="scheduled"
        fields={[
          {
            label: "Date:",
            value: dateTimeStr,
            isBold: true,
          },
          {
            label: "Reason:",
            value: reason,
            isQuoted: true,
          },
        ]}
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />
    </EditorialCardBase>
  );
}

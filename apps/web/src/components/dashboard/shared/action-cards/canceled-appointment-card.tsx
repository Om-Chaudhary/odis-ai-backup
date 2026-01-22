"use client";

import { CalendarX } from "lucide-react";
import { format, parse } from "date-fns";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
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
 * Canceled Appointment Card
 *
 * Editorial design with:
 * - Pink/rose gradient background
 * - Calendar X icon
 * - Date/time in red
 * - Reason in quotes
 * - Large green confirm button OR "Confirmed" badge
 */
export function CanceledAppointmentCard({
  booking,
  outcomeSummary,
  cancellationReason,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: CanceledAppointmentCardProps) {
  // Build date/time string
  const dateTimeStr =
    booking?.date && booking?.start_time
      ? `${formatDate(booking.date)},  ${formatTime(booking.start_time)}`
      : booking?.date
        ? formatDate(booking.date)
        : null;

  // Get reason text
  const reason =
    booking?.rescheduled_reason ?? cancellationReason ?? outcomeSummary ?? null;

  return (
    <EditorialCardBase variant="canceled" className={className}>
      <EditorialHeader
        title="Appointment Cancelled"
        icon={CalendarX}
        variant="canceled"
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />

      <EditorialFieldList
        variant="canceled"
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
      />
    </EditorialCardBase>
  );
}

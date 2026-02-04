"use client";

import { CalendarX } from "lucide-react";
import { format, parse } from "date-fns";
import { parseAndFormatAppointmentDate } from "@odis-ai/shared/util";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
} from "./editorial";

interface CanceledAppointmentCardProps {
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** Appointment date from structured_data (YYYY-MM-DD) */
  appointmentDate?: string | null;
  /** Appointment time from structured_data (HH:MM) */
  appointmentTime?: string | null;
  /** Cancellation reason from structured_data (why they're cancelling) */
  cancellationReason?: string | null;
  /** Visit reason from VAPI structured output (2-5 words, e.g., "Annual checkup") */
  appointmentReason?: string | null;
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
 * Format time for display (HH:MM:SS or HH:MM -> h:mm a)
 */
function formatTime(time: string): string {
  try {
    // Try HH:MM format first (from structured_data)
    if (time.split(":").length === 2) {
      const parsed = parse(time, "HH:mm", new Date());
      return format(parsed, "h:mm a");
    }
    // Fall back to HH:MM:SS format (from booking table)
    const parsed = parse(time, "HH:mm:ss", new Date());
    return format(parsed, "h:mm a");
  } catch {
    return time;
  }
}

/**
 * Format date for display (YYYY-MM-DD -> MMM d)
 * Also handles natural language dates that may come from VAPI
 */
function formatDate(dateStr: string): string {
  return parseAndFormatAppointmentDate(dateStr);
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
  appointmentDate,
  appointmentTime,
  cancellationReason,
  appointmentReason,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: CanceledAppointmentCardProps) {
  // Priority: structured_data fields, then booking fields
  const date = appointmentDate ?? booking?.date;
  const time = appointmentTime ?? booking?.start_time;

  // Build date/time string
  const dateTimeStr =
    date && time
      ? `${formatDate(date)},  ${formatTime(time)}`
      : date
        ? formatDate(date)
        : null;

  // Get reason text - use structured reasons only, no fallback to long outcomeSummary
  // Priority: appointmentReason (concise visit reason like "Routine checkup"),
  // then cancellationReason (why cancelling - often long), then booking reason
  const reason =
    appointmentReason ?? cancellationReason ?? booking?.reason ?? null;

  return (
    <EditorialCardBase variant="canceled" className={className}>
      <EditorialHeader
        title="Appointment Cancelled"
        icon={CalendarX}
        variant="canceled"
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
        ].filter((field) => field.value !== null)}
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />
    </EditorialCardBase>
  );
}

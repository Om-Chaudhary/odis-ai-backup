"use client";

import { CalendarCheck } from "lucide-react";
import { format, parse } from "date-fns";
import { parseAndFormatAppointmentDate } from "@odis-ai/shared/util";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialFieldList,
} from "./editorial";

interface ScheduledAppointmentCardProps {
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** Appointment date from structured_data (YYYY-MM-DD) */
  appointmentDate?: string | null;
  /** Appointment time from structured_data (HH:MM) */
  appointmentTime?: string | null;
  /** Reason from structured_data (short, structured) */
  appointmentReason?: string | null;
  /** Fallback: Summary of the scheduled appointment from VAPI */
  outcomeSummary?: string;
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
  appointmentDate,
  appointmentTime,
  appointmentReason,
  outcomeSummary,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: ScheduledAppointmentCardProps) {
  // Priority: booking fields first (always YYYY-MM-DD format), then structured_data
  // Booking data is more reliable because structured_data may contain relative text like "tomorrow"
  const date = booking?.date ?? appointmentDate;
  const time = booking?.start_time ?? appointmentTime;

  // Build date/time string (e.g., "Jan 25, 9:30 AM")
  const dateTimeStr =
    date && time
      ? `${formatDate(date)},  ${formatTime(time)}`
      : date
        ? formatDate(date)
        : null;

  // Get reason text - prioritize structured structured_data reason
  const reason = appointmentReason ?? booking?.reason ?? outcomeSummary ?? null;

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
        ].filter((field) => field.value !== null)}
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />
    </EditorialCardBase>
  );
}

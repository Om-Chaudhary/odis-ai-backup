"use client";

import { CalendarClock } from "lucide-react";
import { format, parse } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  getEditorialVariantStyles,
} from "./editorial";

interface RescheduledAppointmentCardProps {
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** Fallback: Summary of the rescheduled appointment from VAPI */
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
 * Rescheduled Appointment Card
 *
 * Editorial design with:
 * - Green gradient background
 * - Calendar clock icon with notification dots
 * - Original and new date/time in teal
 * - Reason in quotes
 * - Large green confirm button
 */
export function RescheduledAppointmentCard({
  booking,
  outcomeSummary,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: RescheduledAppointmentCardProps) {
  const styles = getEditorialVariantStyles("rescheduled");

  // Build new date/time string
  const newDateTimeStr =
    booking?.date && booking?.start_time
      ? `${formatDate(booking.date)},  ${formatTime(booking.start_time)}`
      : booking?.date
        ? formatDate(booking.date)
        : null;

  // Build original date/time string (if available)
  const originalDateTimeStr =
    booking?.original_date && booking?.original_time
      ? `${formatDate(booking.original_date)},  ${formatTime(booking.original_time)}`
      : booking?.original_date
        ? formatDate(booking.original_date)
        : null;

  // Get reason text
  const reason = booking?.rescheduled_reason ?? outcomeSummary ?? null;

  return (
    <EditorialCardBase variant="rescheduled" className={className}>
      <EditorialHeader
        title="Appointment Rescheduled"
        icon={CalendarClock}
        variant="rescheduled"
        showNotificationDots
        showConfirmButton
        onConfirm={onConfirm}
        isConfirming={isConfirming}
        isConfirmed={isConfirmed}
      />

      {/* Custom field layout for Original/New side by side */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="px-5 pb-5 pt-1 space-y-1.5"
      >
        {/* Date row with Original and New */}
        <div className="flex items-baseline gap-6">
          {originalDateTimeStr && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-sm text-muted-foreground">Original:</span>
              <span className={cn("text-lg font-semibold", styles.valueColor)}>
                {originalDateTimeStr}
              </span>
            </motion.div>
          )}

          {newDateTimeStr && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.25 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-sm text-muted-foreground">New:</span>
              <span className={cn("text-lg font-bold", styles.valueColor)}>
                {newDateTimeStr}
              </span>
            </motion.div>
          )}
        </div>

        {/* Reason */}
        {reason && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            className="flex items-baseline gap-3"
          >
            <span className="text-sm text-muted-foreground">Reason:</span>
            <span className="text-sm italic text-muted-foreground">
              "{reason}"
            </span>
          </motion.div>
        )}
      </motion.div>
    </EditorialCardBase>
  );
}

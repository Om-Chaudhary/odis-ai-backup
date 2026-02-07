"use client";

import { CalendarClock } from "lucide-react";
import { format, parse } from "date-fns";
import { motion } from "framer-motion";
import { cn, parseAndFormatAppointmentDate } from "@odis-ai/shared/util";
import type { BookingData } from "../../inbound/types";
import {
  EditorialCardBase,
  EditorialHeader,
  EditorialConfirmButton,
  getEditorialVariantStyles,
} from "./editorial";

interface RescheduledAppointmentCardProps {
  /** Booking data from vapi_bookings table */
  booking?: BookingData | null;
  /** New appointment date from structured_data (YYYY-MM-DD) */
  appointmentDate?: string | null;
  /** New appointment time from structured_data (HH:MM) */
  appointmentTime?: string | null;
  /** Original appointment date from structured_data (YYYY-MM-DD) */
  originalDate?: string | null;
  /** Original appointment time from structured_data (HH:MM) */
  originalTime?: string | null;
  /** Visit reason from VAPI structured output (2-5 words, e.g., "Itchy skin") */
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
  appointmentDate,
  appointmentTime,
  originalDate,
  originalTime,
  appointmentReason,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: RescheduledAppointmentCardProps) {
  const styles = getEditorialVariantStyles("rescheduled");

  // Priority: booking fields first (reliable database records), then structured_data
  // Booking data is more reliable because structured_data may contain hallucinated dates from VAPI
  const newDate = booking?.date ?? appointmentDate;
  const newTime = booking?.start_time ?? appointmentTime;
  const origDate = booking?.original_date ?? originalDate;
  const origTime = booking?.original_time ?? originalTime;

  // Build new date/time string
  const newDateTimeStr =
    newDate && newTime
      ? `${formatDate(newDate)},  ${formatTime(newTime)}`
      : newDate
        ? formatDate(newDate)
        : null;

  // Build original date/time string (if available)
  const originalDateTimeStr =
    origDate && origTime
      ? `${formatDate(origDate)},  ${formatTime(origTime)}`
      : origDate
        ? formatDate(origDate)
        : null;

  // Get reason text - use structured appointment reason (visit reason like "Itchy skin")
  // No fallback to long outcomeSummary - better to show nothing than overflow
  const reason = appointmentReason ?? booking?.reason ?? null;

  return (
    <EditorialCardBase variant="rescheduled" className={className}>
      <EditorialHeader
        title="Appointment Rescheduled"
        icon={CalendarClock}
        variant="rescheduled"
        showNotificationDots
      />

      {/* Custom field layout for Original/New side by side with confirm button on right */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="px-5 pt-1 pb-5"
      >
        {/* Flex container: Fields on left, Confirm button on right */}
        <div className="flex items-start gap-4">
          {/* Field content - grows to fill space */}
          <div className="flex-1 space-y-1.5">
            {/* Date row with Original and New */}
            <div className="flex items-baseline gap-6">
              {originalDateTimeStr && (
                <motion.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.25 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-muted-foreground text-sm font-medium">
                    Original:
                  </span>
                  <span
                    className={cn("text-lg font-semibold", styles.valueColor)}
                  >
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
                  <span className="text-muted-foreground text-sm font-medium">
                    New:
                  </span>
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
                <span className="text-muted-foreground min-w-[80px] text-sm font-medium">
                  Reason:
                </span>
                <span className="text-muted-foreground/80 line-clamp-2 text-base leading-relaxed italic">
                  "{reason}"
                </span>
              </motion.div>
            )}
          </div>

          {/* Confirm button column on the right */}
          {(onConfirm ?? isConfirmed) && (
            <div className="shrink-0 pt-1">
              <EditorialConfirmButton
                onClick={onConfirm}
                isLoading={isConfirming}
                isConfirmed={isConfirmed}
              />
            </div>
          )}
        </div>
      </motion.div>
    </EditorialCardBase>
  );
}

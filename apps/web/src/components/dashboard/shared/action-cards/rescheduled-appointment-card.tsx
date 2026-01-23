"use client";

import { CalendarClock } from "lucide-react";
import { format, parse } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@odis-ai/shared/util";
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
  /** New appointment date from action_card_data (YYYY-MM-DD) */
  appointmentDate?: string | null;
  /** New appointment time from action_card_data (HH:MM) */
  appointmentTime?: string | null;
  /** Original appointment date from action_card_data (YYYY-MM-DD) */
  originalDate?: string | null;
  /** Original appointment time from action_card_data (HH:MM) */
  originalTime?: string | null;
  /** Reschedule reason from action_card_data */
  rescheduleReason?: string | null;
  /** Fallback: Summary of the rescheduled appointment from VAPI */
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
    // Try HH:MM format first (from action_card_data)
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
 */
function formatDate(dateStr: string): string {
  try {
    // Parse as local date (not UTC) by explicitly specifying format
    const date = parse(dateStr, "yyyy-MM-dd", new Date());
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
  appointmentDate,
  appointmentTime,
  originalDate,
  originalTime,
  rescheduleReason,
  outcomeSummary,
  onConfirm,
  isConfirming,
  isConfirmed,
  className,
}: RescheduledAppointmentCardProps) {
  const styles = getEditorialVariantStyles("rescheduled");

  // Priority: action_card_data fields, then booking fields
  const newDate = appointmentDate ?? booking?.date;
  const newTime = appointmentTime ?? booking?.start_time;
  const origDate = originalDate ?? booking?.original_date;
  const origTime = originalTime ?? booking?.original_time;

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

  // Get reason text - prioritize structured reason
  const reason = rescheduleReason ?? booking?.rescheduled_reason ?? outcomeSummary ?? null;

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
        className="px-5 pb-5 pt-1"
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
                  <span className="text-sm font-medium text-muted-foreground">Original:</span>
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
                  <span className="text-sm font-medium text-muted-foreground">New:</span>
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
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Reason:</span>
                <span className="text-base italic text-muted-foreground/80 leading-relaxed">
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

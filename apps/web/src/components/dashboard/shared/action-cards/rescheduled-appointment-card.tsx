"use client";

import { CalendarClock, Check, Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@odis-ai/shared/util";
import type { BookingData } from "../../inbound/types";
import { SimpleCardBase, getCardVariantStyles } from "./simple-card-base";

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
 * Format date for display (YYYY-MM-DD -> MMM d, yyyy)
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Rescheduled Appointment Card
 *
 * Shows both original and new appointment times:
 * - Icon + header line
 * - Original date/time (struck through or labeled)
 * - New date/time
 * - Reason in quotes
 * - Simple confirm button
 */
export function RescheduledAppointmentCard({
  booking,
  outcomeSummary,
  onConfirm,
  isConfirming,
  className,
}: RescheduledAppointmentCardProps) {
  const styles = getCardVariantStyles("rescheduled");

  // Build new date/time string
  const newDateTimeStr =
    booking?.date && booking?.start_time
      ? `${formatDate(booking.date)} at ${formatTime(booking.start_time)}`
      : booking?.date
        ? formatDate(booking.date)
        : null;

  // Build original date/time string (if available)
  const originalDateTimeStr =
    booking?.original_date && booking?.original_time
      ? `${formatDate(booking.original_date)} at ${formatTime(booking.original_time)}`
      : booking?.original_date
        ? formatDate(booking.original_date)
        : null;

  // Get reason text
  const reason = booking?.rescheduled_reason ?? outcomeSummary ?? null;

  return (
    <SimpleCardBase variant="rescheduled" className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", styles.iconBg)}>
            <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Appointment Rescheduled
          </h3>
        </div>

        {/* Date/Time info */}
        <div className="mt-2.5 space-y-1">
          {/* Original time */}
          {originalDateTimeStr && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-muted-foreground/70">
                Original:
              </span>{" "}
              <span className="line-through">{originalDateTimeStr}</span>
            </p>
          )}

          {/* New time */}
          {newDateTimeStr && (
            <p className="text-sm text-foreground/90">
              <span className="font-medium text-sage-600">New:</span>{" "}
              <span className="font-medium">{newDateTimeStr}</span>
            </p>
          )}
        </div>

        {/* Reason */}
        {reason && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            "{reason}"
          </p>
        )}

        {/* Confirm button */}
        {onConfirm && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onConfirm}
              disabled={isConfirming}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5",
                "text-xs font-medium",
                "bg-sage-500 text-white",
                "hover:bg-sage-600 active:bg-sage-700",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "transition-colors duration-150",
              )}
            >
              {isConfirming ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              Confirm
            </button>
          </div>
        )}
      </div>
    </SimpleCardBase>
  );
}

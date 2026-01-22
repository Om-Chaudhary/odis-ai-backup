"use client";

import { CalendarCheck, Check, Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@odis-ai/shared/util";
import type { BookingData } from "../../inbound/types";
import { SimpleCardBase, getCardVariantStyles } from "./simple-card-base";

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
 * Scheduled Appointment Card
 *
 * Clean, utilitarian design:
 * - Icon + header line
 * - Combined date/time
 * - Reason in quotes
 * - Simple confirm button
 */
export function ScheduledAppointmentCard({
  booking,
  outcomeSummary,
  onConfirm,
  isConfirming,
  className,
}: ScheduledAppointmentCardProps) {
  const styles = getCardVariantStyles("scheduled");

  // Build date/time string
  const dateTimeStr =
    booking?.date && booking?.start_time
      ? `${formatDate(booking.date)} at ${formatTime(booking.start_time)}`
      : booking?.date
        ? formatDate(booking.date)
        : null;

  // Get reason text
  const reason = booking?.reason ?? outcomeSummary ?? null;

  return (
    <SimpleCardBase variant="scheduled" className={className}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className={cn("rounded-md p-1.5", styles.iconBg)}>
            <CalendarCheck className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Appointment Scheduled
          </h3>
        </div>

        {/* Date/Time */}
        {dateTimeStr && (
          <p className="mt-2.5 text-sm font-medium text-foreground/90">
            {dateTimeStr}
          </p>
        )}

        {/* Reason */}
        {reason && (
          <p className="mt-1.5 text-sm italic text-muted-foreground">
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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { Send, AlertTriangle, Phone, Mail } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { DeliveryToggles } from "../../types";

interface PartialDeliveryActionsProps {
  phoneStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
  ownerPhone: string | null;
  ownerEmail: string | null;
  deliveryToggles: DeliveryToggles;
  onToggleChange: (toggles: DeliveryToggles) => void;
  onScheduleRemaining?: () => void;
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isSubmitting?: boolean;
  isCancelling?: boolean;
}

/**
 * PartialDeliveryActions - Shows options for scheduling remaining channels
 *
 * This component focuses on what's NOT yet sent or scheduled.
 * Completed/scheduled status is shown in StatusOverviewCard.
 */
export function PartialDeliveryActions({
  phoneStatus,
  emailStatus,
  scheduledCallFor,
  scheduledEmailFor,
  hasOwnerPhone,
  hasOwnerEmail,
  ownerPhone,
  ownerEmail,
  deliveryToggles: _deliveryToggles,
  onToggleChange,
  onScheduleRemaining,
  onCancelScheduled: _onCancelScheduled,
  isSubmitting,
  isCancelling: _isCancelling,
}: PartialDeliveryActionsProps) {
  // Actual delivery states
  const phoneSent = phoneStatus === "sent";
  const emailSent = emailStatus === "sent";
  const phoneFailed = phoneStatus === "failed";
  const emailFailed = emailStatus === "failed";

  // FIXED: Only consider "scheduled" if status is actually pending
  // scheduledFor timestamps persist after delivery, so we must check actual status
  const phoneScheduled = phoneStatus === "pending" && Boolean(scheduledCallFor);
  const emailScheduled =
    emailStatus === "pending" && Boolean(scheduledEmailFor);

  // Determine what's remaining (not sent, not failed, not scheduled, has contact info)
  const phoneRemaining =
    !phoneSent && !phoneFailed && !phoneScheduled && hasOwnerPhone;
  const emailRemaining =
    !emailSent && !emailFailed && !emailScheduled && hasOwnerEmail;

  // Cancel handlers removed - StatusOverviewCard handles cancel actions

  const handleScheduleRemaining = () => {
    // Set toggles for remaining channels
    onToggleChange({
      phoneEnabled: phoneRemaining,
      emailEnabled: emailRemaining,
    });
    // Schedule
    if (onScheduleRemaining) {
      onScheduleRemaining();
    }
  };

  // Don't render if nothing remains to schedule
  if (!phoneRemaining && !emailRemaining) {
    return null;
  }

  return (
    <Card
      className={cn(
        "rounded-xl border shadow-sm backdrop-blur-md",
        "bg-gradient-to-br from-white/80 via-amber-50/30 to-white/80",
        "dark:from-slate-900/80 dark:via-amber-950/30 dark:to-slate-900/80",
        "border-amber-200/50 dark:border-amber-800/50",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              "bg-gradient-to-br from-amber-100 to-orange-100",
              "dark:from-amber-900/50 dark:to-orange-900/50",
              "shadow-inner",
            )}
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-slate-800 dark:text-white">
              Schedule Remaining
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete discharge outreach
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Only show remaining channels - completed/scheduled status is in StatusOverviewCard */}
        <div className="space-y-2">
          {phoneRemaining && (
            <div className="flex items-center gap-2.5 rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/50">
                <Phone className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Phone Call
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ownerPhone}
                </p>
              </div>
            </div>
          )}
          {emailRemaining && (
            <div className="flex items-center gap-2.5 rounded-lg bg-amber-50/50 p-3 dark:bg-amber-950/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/50">
                <Mail className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {ownerEmail}
                </p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleScheduleRemaining}
          disabled={isSubmitting}
          className={cn(
            "h-10 w-full gap-2 font-semibold transition-all",
            "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700",
            "dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-600 dark:hover:to-orange-600",
            "shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Schedule Remaining</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

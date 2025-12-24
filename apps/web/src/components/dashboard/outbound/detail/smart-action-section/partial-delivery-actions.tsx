import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import {
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import { Separator } from "@odis-ai/shared/ui/separator";
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
  onCancelScheduled,
  isSubmitting,
  isCancelling,
}: PartialDeliveryActionsProps) {
  const phoneSent = phoneStatus === "sent";
  const emailSent = emailStatus === "sent";
  const phoneScheduled = Boolean(scheduledCallFor);
  const emailScheduled = Boolean(scheduledEmailFor);

  // Determine what's remaining
  const phoneRemaining = !phoneSent && !phoneScheduled && hasOwnerPhone;
  const emailRemaining = !emailSent && !emailScheduled && hasOwnerEmail;

  const handleCancelCall = () => {
    if (onCancelScheduled && phoneScheduled) {
      onCancelScheduled({ cancelCall: true, cancelEmail: false });
    }
  };

  const handleCancelEmail = () => {
    if (onCancelScheduled && emailScheduled) {
      onCancelScheduled({ cancelCall: false, cancelEmail: true });
    }
  };

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

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} at ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  };

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
          {/* Icon with gradient background */}
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
              Partial Delivery
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete remaining outreach
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Show what's completed/scheduled */}
        <div className="space-y-2">
          {phoneSent && (
            <div className="flex items-center gap-2.5 rounded-lg bg-green-50/50 p-3 dark:bg-green-950/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Phone call completed
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {ownerPhone}
                </p>
              </div>
            </div>
          )}
          {phoneScheduled && (
            <div className="space-y-2 rounded-lg bg-purple-50/50 p-3 dark:bg-purple-950/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/50">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Phone call scheduled
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {formatScheduledTime(scheduledCallFor!)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelCall}
                disabled={isCancelling}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:text-purple-300"
              >
                {isCancelling ? "Cancelling..." : "Cancel Phone"}
              </Button>
            </div>
          )}

          {emailSent && (
            <div className="flex items-center gap-2.5 rounded-lg bg-green-50/50 p-3 dark:bg-green-950/30">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Email sent
                </p>
                <p className="max-w-[200px] truncate text-xs text-green-600 dark:text-green-400">
                  {ownerEmail}
                </p>
              </div>
            </div>
          )}
          {emailScheduled && (
            <div className="space-y-2 rounded-lg bg-purple-50/50 p-3 dark:bg-purple-950/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/50">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Email scheduled
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {formatScheduledTime(scheduledEmailFor!)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEmail}
                disabled={isCancelling}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:text-purple-300"
              >
                {isCancelling ? "Cancelling..." : "Cancel Email"}
              </Button>
            </div>
          )}
        </div>

        {/* Show what's remaining */}
        {(phoneRemaining || emailRemaining) && (
          <>
            <Separator className="bg-amber-200/50 dark:bg-amber-800/50" />
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                Remaining Channels
              </p>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/ui/card";
import { Button } from "@odis-ai/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@odis-ai/ui/alert-dialog";
import { Calendar, Mail, Phone, X, Loader2 } from "lucide-react";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";

interface ScheduleInfoCardProps {
  emailScheduledFor: string | null;
  callScheduledFor: string | null;
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isCancelling?: boolean;
}

/**
 * Schedule info card for scheduled cases
 * Shows scheduled delivery times with option to cancel
 */
export function ScheduleInfoCard({
  emailScheduledFor,
  callScheduledFor,
  onCancelScheduled,
  isCancelling = false,
}: ScheduleInfoCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<
    "call" | "email" | "all" | null
  >(null);

  const formatScheduleTime = (isoString: string | null) => {
    if (!isoString) return null;
    try {
      const date = parseISO(isoString);
      const isDatePast = isPast(date);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });
      const absoluteTime = format(date, "EEE, MMM d 'at' h:mm a");

      return {
        relative: isDatePast ? "Ready to send" : relativeTime,
        absolute: absoluteTime,
        isPast: isDatePast,
      };
    } catch {
      return null;
    }
  };

  const emailTime = formatScheduleTime(emailScheduledFor);
  const callTime = formatScheduleTime(callScheduledFor);

  const handleCancelClick = (target: "call" | "email" | "all") => {
    setCancelTarget(target);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget || !onCancelScheduled) return;

    onCancelScheduled({
      cancelCall: cancelTarget === "call" || cancelTarget === "all",
      cancelEmail: cancelTarget === "email" || cancelTarget === "all",
    });
    setShowCancelDialog(false);
    setCancelTarget(null);
  };

  const getCancelDescription = () => {
    switch (cancelTarget) {
      case "call":
        return "This will cancel the scheduled phone call. The call will not be made and will need to be rescheduled manually if needed.";
      case "email":
        return "This will cancel the scheduled email. The email will not be sent and will need to be rescheduled manually if needed.";
      case "all":
        return "This will cancel all scheduled communications (phone call and email). They will need to be rescheduled manually if needed.";
      default:
        return "";
    }
  };

  const hasBothScheduled = emailTime && callTime;

  return (
    <>
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              Scheduled Communications
            </CardTitle>
            {hasBothScheduled && onCancelScheduled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => handleCancelClick("all")}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                Cancel All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {emailTime && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                  <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground text-xs">
                    {emailTime.absolute}
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    {emailTime.relative}
                  </p>
                </div>
              </div>
              {!hasBothScheduled && onCancelScheduled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleCancelClick("email")}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  Cancel
                </Button>
              )}
              {hasBothScheduled && onCancelScheduled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleCancelClick("email")}
                  disabled={isCancelling}
                  title="Cancel email"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {callTime && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/10">
                  <Phone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone Call</p>
                  <p className="text-muted-foreground text-xs">
                    {callTime.absolute}
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">
                    {callTime.relative}
                  </p>
                </div>
              </div>
              {!hasBothScheduled && onCancelScheduled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleCancelClick("call")}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                  Cancel
                </Button>
              )}
              {hasBothScheduled && onCancelScheduled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleCancelClick("call")}
                  disabled={isCancelling}
                  title="Cancel call"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          {!emailTime && !callTime && (
            <p className="text-muted-foreground text-sm">
              No communications scheduled.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              {getCancelDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Scheduled
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

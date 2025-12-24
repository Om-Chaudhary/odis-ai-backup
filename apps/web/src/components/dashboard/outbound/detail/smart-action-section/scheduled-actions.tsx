import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Button } from "@odis-ai/shared/ui/button";
import { AlertCircle } from "lucide-react";

interface ScheduledActionsProps {
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isCancelling?: boolean;
}

export function ScheduledActions({
  scheduledCallFor,
  scheduledEmailFor,
  onCancelScheduled,
  isCancelling,
}: ScheduledActionsProps) {
  const hasScheduledCall = Boolean(scheduledCallFor);
  const hasScheduledEmail = Boolean(scheduledEmailFor);
  const hasBothScheduled = hasScheduledCall && hasScheduledEmail;

  if (!hasScheduledCall && !hasScheduledEmail) {
    return null;
  }

  const handleCancelAll = () => {
    if (onCancelScheduled) {
      onCancelScheduled({
        cancelCall: hasScheduledCall,
        cancelEmail: hasScheduledEmail,
      });
    }
  };

  const handleCancelCall = () => {
    if (onCancelScheduled && hasScheduledCall) {
      onCancelScheduled({
        cancelCall: true,
        cancelEmail: false,
      });
    }
  };

  const handleCancelEmail = () => {
    if (onCancelScheduled && hasScheduledEmail) {
      onCancelScheduled({
        cancelCall: false,
        cancelEmail: true,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-purple-600" />
          Scheduled Communications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {hasBothScheduled
            ? "Both phone call and email are scheduled. You can cancel individual channels or all at once."
            : hasScheduledCall
              ? "Phone call is scheduled. Cancel to prevent delivery."
              : "Email is scheduled. Cancel to prevent delivery."}
        </p>

        <div className="flex flex-col gap-2">
          {hasBothScheduled && (
            <Button
              variant="destructive"
              onClick={handleCancelAll}
              disabled={isCancelling}
              className="w-full"
            >
              {isCancelling ? "Cancelling..." : "Cancel All"}
            </Button>
          )}

          <div className="flex gap-2">
            {hasScheduledCall && (
              <Button
                variant="outline"
                onClick={handleCancelCall}
                disabled={isCancelling}
                className="flex-1"
              >
                {isCancelling ? "Cancelling..." : "Cancel Phone"}
              </Button>
            )}
            {hasScheduledEmail && (
              <Button
                variant="outline"
                onClick={handleCancelEmail}
                disabled={isCancelling}
                className="flex-1"
              >
                {isCancelling ? "Cancelling..." : "Cancel Email"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

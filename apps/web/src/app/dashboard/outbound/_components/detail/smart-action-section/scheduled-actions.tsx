import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Clock } from "lucide-react";

interface ScheduledActionsProps {
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  // Cancel handlers removed - use StatusOverviewCard for cancel actions
  onCancelScheduled?: (options: {
    cancelCall: boolean;
    cancelEmail: boolean;
  }) => void;
  isCancelling?: boolean;
}

/**
 * ScheduledActions - Informational card for fully scheduled cases
 *
 * NOTE: Cancel buttons have been removed from this component to avoid duplication.
 * Cancel actions are handled by StatusOverviewCard which provides inline cancel
 * buttons next to each scheduled item.
 */
export function ScheduledActions({
  scheduledCallFor,
  scheduledEmailFor,
}: ScheduledActionsProps) {
  const hasScheduledCall = Boolean(scheduledCallFor);
  const hasScheduledEmail = Boolean(scheduledEmailFor);
  const hasBothScheduled = hasScheduledCall && hasScheduledEmail;

  if (!hasScheduledCall && !hasScheduledEmail) {
    return null;
  }

  return (
    <Card className="border-purple-200/50 bg-purple-50/30 dark:border-purple-800/50 dark:bg-purple-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          Awaiting Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {hasBothScheduled
            ? "Both phone call and email are scheduled for delivery. Use the status cards above to cancel if needed."
            : hasScheduledCall
              ? "Phone call is scheduled for delivery."
              : "Email is scheduled for delivery."}
        </p>
      </CardContent>
    </Card>
  );
}

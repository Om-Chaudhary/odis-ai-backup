/**
 * Follow-Up Card
 *
 * Displays follow-up and recheck information from the call
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  CalendarCheck,
  CalendarPlus,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface FollowUpData {
  recheck_reminder_delivered?: boolean;
  recheck_confirmed?: boolean;
  appointment_requested?: boolean;
  follow_up_call_needed?: boolean;
  follow_up_reason?: string;
}

interface FollowUpCardProps {
  data: FollowUpData | null;
}

export function FollowUpCard({ data }: FollowUpCardProps) {
  if (!data) {
    return null;
  }

  // Check if any follow-up data is present
  const hasData =
    data.recheck_reminder_delivered !== undefined ||
    data.recheck_confirmed !== undefined ||
    data.appointment_requested !== undefined ||
    data.follow_up_call_needed !== undefined ||
    data.follow_up_reason;

  if (!hasData) {
    return null;
  }

  // Determine if action is needed
  const needsAction = data.appointment_requested ?? data.follow_up_call_needed;

  return (
    <Card
      className={cn(
        "bg-white/50 backdrop-blur-sm dark:bg-slate-900/50",
        needsAction
          ? "border-blue-300 dark:border-blue-800"
          : "border-slate-200/50 dark:border-slate-700/50",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              "rounded-md p-1.5",
              needsAction ? "bg-blue-100" : "bg-slate-100",
            )}
          >
            <CalendarCheck
              className={cn(
                "h-4 w-4",
                needsAction ? "text-blue-600" : "text-slate-600",
              )}
            />
          </div>
          Follow-Up Status
          {needsAction && (
            <Badge className="ml-auto border-0 bg-blue-100 text-xs font-medium text-blue-700">
              Action Needed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.recheck_reminder_delivered !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              <Clock className="mr-1 inline h-3 w-3" />
              Recheck Reminder
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                data.recheck_reminder_delivered
                  ? "text-green-600"
                  : "text-slate-500",
              )}
            >
              {data.recheck_reminder_delivered ? "Delivered" : "Not Delivered"}
            </span>
          </div>
        )}

        {data.recheck_confirmed !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              Recheck Confirmed
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                data.recheck_confirmed ? "text-green-600" : "text-amber-600",
              )}
            >
              {data.recheck_confirmed ? "Yes" : "No"}
            </span>
          </div>
        )}

        {data.appointment_requested && (
          <div className="flex items-center gap-2 rounded-md bg-blue-50 p-2 dark:bg-blue-950/30">
            <CalendarPlus className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Appointment Requested
            </span>
          </div>
        )}

        {data.follow_up_call_needed && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-2 dark:bg-amber-950/30">
            <Phone className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Follow-Up Call Needed
            </span>
          </div>
        )}

        {data.follow_up_reason && (
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <AlertCircle className="mr-1 inline h-3 w-3" />
              Reason
            </span>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {data.follow_up_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Escalation Card
 *
 * Displays escalation and transfer information from the call
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@odis-ai/shared/ui/card";
import { Badge } from "@odis-ai/shared/ui/badge";
import {
  AlertOctagon,
  AlertTriangle,
  Phone,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface EscalationData {
  escalation_triggered?: boolean;
  escalation_type?: string;
  transfer_attempted?: boolean;
  transfer_successful?: boolean;
  escalation_reason?: string;
}

interface EscalationCardProps {
  data: EscalationData | null;
}

const escalationTypeConfig: Record<
  string,
  { icon: typeof AlertOctagon; label: string; color: string; bgColor: string }
> = {
  emergency: {
    icon: AlertOctagon,
    label: "Emergency",
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  urgent: {
    icon: AlertTriangle,
    label: "Urgent",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  callback_requested: {
    icon: Phone,
    label: "Callback Requested",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  none: {
    icon: CheckCircle2,
    label: "None",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

export function EscalationCard({ data }: EscalationCardProps) {
  // Only show if escalation was triggered or explicitly set to false
  if (data?.escalation_triggered === undefined) {
    return null;
  }

  // If no escalation, optionally show a success state or hide
  if (!data.escalation_triggered && data.escalation_type === "none") {
    return null; // Hide when no escalation (clean dashboard)
  }

  const escalationType = data.escalation_type
    ? (escalationTypeConfig[data.escalation_type] ?? {
        icon: AlertTriangle,
        label: data.escalation_type.replace(/_/g, " "),
        color: "text-amber-600",
        bgColor: "bg-amber-100",
      })
    : null;

  const Icon = escalationType?.icon ?? AlertTriangle;

  // Determine card styling based on escalation type
  const isEmergency = data.escalation_type === "emergency";
  const isUrgent = data.escalation_type === "urgent";
  const cardBorderClass = isEmergency
    ? "border-red-300 dark:border-red-800"
    : isUrgent
      ? "border-orange-300 dark:border-orange-800"
      : "border-slate-200/50 dark:border-slate-700/50";

  return (
    <Card
      className={cn(
        "bg-white/50 backdrop-blur-sm dark:bg-slate-900/50",
        cardBorderClass,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              "rounded-md p-1.5",
              escalationType?.bgColor ?? "bg-amber-100",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4",
                escalationType?.color ?? "text-amber-600",
              )}
            />
          </div>
          Escalation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.escalation_triggered && escalationType && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Type
            </span>
            <Badge
              className={cn(
                "font-medium",
                escalationType.bgColor,
                escalationType.color,
                "border-0",
              )}
            >
              <Icon className="mr-1 h-3 w-3" />
              {escalationType.label}
            </Badge>
          </div>
        )}

        {data.transfer_attempted !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              <ArrowRightLeft className="mr-1 inline h-3 w-3" />
              Transfer Attempted
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                data.transfer_attempted ? "text-blue-600" : "text-slate-500",
              )}
            >
              {data.transfer_attempted ? "Yes" : "No"}
            </span>
          </div>
        )}

        {data.transfer_attempted && data.transfer_successful !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Transfer Result
            </span>
            <div className="flex items-center gap-1">
              {data.transfer_successful ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Successful
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-600">
                    Failed
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {data.escalation_reason && (
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Reason
            </span>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {data.escalation_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

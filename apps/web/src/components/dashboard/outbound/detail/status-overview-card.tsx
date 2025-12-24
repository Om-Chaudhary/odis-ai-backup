import { Button } from "@odis-ai/shared/ui/button";
import { Card, CardContent } from "@odis-ai/shared/ui/card";
import {
  Phone,
  Mail,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { DischargeCaseStatus } from "../types";
import { cn } from "@odis-ai/shared/util";

interface StatusOverviewCardProps {
  status: DischargeCaseStatus;
  phoneStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  scheduledCallFor: string | null;
  scheduledEmailFor: string | null;
  hasOwnerPhone: boolean;
  hasOwnerEmail: boolean;
  ownerPhone: string | null;
  ownerEmail: string | null;
  onCancelCall?: () => void;
  onCancelEmail?: () => void;
  isCancelling?: boolean;
}

type DeliveryItemStatus = "scheduled" | "sent" | "failed" | "pending";

interface DeliveryItemProps {
  icon: LucideIcon;
  label: string;
  scheduledFor: string;
  deliveryStatus: "sent" | "pending" | "failed" | "not_applicable" | null;
  onCancel?: () => void;
  isCancelling?: boolean;
}

function DeliveryItem({
  icon: Icon,
  label,
  scheduledFor,
  deliveryStatus,
  onCancel,
  isCancelling,
}: DeliveryItemProps) {
  const date = new Date(scheduledFor);
  const isPast = date < new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Determine actual status
  let status: DeliveryItemStatus = "scheduled";
  let statusText = `${label} scheduled`;
  let statusColor: "purple" | "green" | "red" | "amber" = "purple";
  let StatusIcon = Clock;

  if (isPast || deliveryStatus === "sent") {
    status = "sent";
    statusText = `${label} delivered`;
    statusColor = "green";
    StatusIcon = CheckCircle2;
  } else if (deliveryStatus === "failed") {
    status = "failed";
    statusText = `${label} failed`;
    statusColor = "red";
    StatusIcon = XCircle;
  } else if (deliveryStatus === "pending") {
    status = "pending";
    statusText = `${label} pending`;
    statusColor = "amber";
    StatusIcon = AlertCircle;
  }

  const colorClasses = {
    purple: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconText: "text-purple-600 dark:text-purple-400",
      dateText: "text-purple-600 dark:text-purple-400",
    },
    green: {
      bg: "bg-green-50 dark:bg-green-950/30",
      iconBg: "bg-green-100 dark:bg-green-900/50",
      iconText: "text-green-600 dark:text-green-400",
      dateText: "text-green-600 dark:text-green-400",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/30",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconText: "text-red-600 dark:text-red-400",
      dateText: "text-red-600 dark:text-red-400",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconText: "text-amber-600 dark:text-amber-400",
      dateText: "text-amber-600 dark:text-amber-400",
    },
  };

  const colors = colorClasses[statusColor];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg p-3",
        colors.bg,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full",
            colors.iconBg,
          )}
        >
          <Icon className={cn("h-4 w-4", colors.iconText)} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {statusText}
          </p>
          <div
            className={cn("flex items-center gap-1 text-xs", colors.dateText)}
          >
            {status === "sent" ? (
              <>
                <StatusIcon className="h-3 w-3" />
                <span>
                  {formattedDate} at {formattedTime}
                </span>
              </>
            ) : status === "failed" ? (
              <>
                <StatusIcon className="h-3 w-3" />
                <span>Failed on {formattedDate}</span>
              </>
            ) : (
              <>
                <Calendar className="h-3 w-3" />
                <span>
                  {formattedDate} at {formattedTime}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      {onCancel && status === "scheduled" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isCancelling}
          className="h-7 text-xs text-slate-500 hover:text-red-600"
        >
          {isCancelling ? "..." : "Cancel"}
        </Button>
      )}
    </div>
  );
}

/**
 * Status Overview Card - Shows delivery status for scheduled/completed items
 * Displays actual status (delivered/failed/pending) instead of just "scheduled"
 */
export function StatusOverviewCard({
  phoneStatus,
  emailStatus,
  scheduledCallFor,
  scheduledEmailFor,
  onCancelCall,
  onCancelEmail,
  isCancelling,
}: StatusOverviewCardProps) {
  // Only render if there's something scheduled
  if (!scheduledCallFor && !scheduledEmailFor) {
    return null;
  }

  return (
    <Card className="border-slate-200/50 bg-white/50 dark:border-slate-700/50 dark:bg-slate-900/50">
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Delivery Status</span>
        </div>
        <div className="space-y-2">
          {scheduledCallFor && (
            <DeliveryItem
              icon={Phone}
              label="Call"
              scheduledFor={scheduledCallFor}
              deliveryStatus={phoneStatus}
              onCancel={onCancelCall}
              isCancelling={isCancelling}
            />
          )}
          {scheduledEmailFor && (
            <DeliveryItem
              icon={Mail}
              label="Email"
              scheduledFor={scheduledEmailFor}
              deliveryStatus={emailStatus}
              onCancel={onCancelEmail}
              isCancelling={isCancelling}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

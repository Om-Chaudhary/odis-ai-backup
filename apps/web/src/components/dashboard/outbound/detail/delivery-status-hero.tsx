import { Card, CardContent } from "@odis-ai/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Phone,
  Mail,
  XCircle,
} from "lucide-react";
import { formatPhoneNumber } from "@odis-ai/utils/phone";
import { format, parseISO } from "date-fns";
import type { DischargeCaseStatus, DeliveryStatus } from "../types";

interface ScheduledCallData {
  id: string;
  status: string;
  durationSeconds: number | null;
  endedReason: string | null;
  transcript: string | null;
  summary: string | null;
}

type DeliveryState =
  | "unsent"
  | "scheduled"
  | "partial"
  | "completed"
  | "failed";

interface DeliveryStatusHeroProps {
  status: DischargeCaseStatus;
  emailStatus: DeliveryStatus;
  phoneStatus: DeliveryStatus;
  scheduledEmailFor?: string | null;
  scheduledCallFor?: string | null;
  scheduledCall?: ScheduledCallData | null;
  hasOwnerEmail: boolean;
  hasOwnerPhone: boolean;
  ownerPhone?: string | null;
  ownerEmail?: string | null;
}

/**
 * Determines the delivery state from case status and delivery statuses
 */
function getDeliveryState(
  status: DischargeCaseStatus,
  emailStatus: DeliveryStatus,
  phoneStatus: DeliveryStatus
): DeliveryState {
  if (status === "failed") return "failed";
  if (status === "completed") return "completed";
  if (status === "scheduled") return "scheduled";

  // Check partial delivery
  const emailSent = emailStatus === "sent";
  const phoneSent = phoneStatus === "sent";
  if (emailSent || phoneSent) return "partial";

  return "unsent";
}

/**
 * Format duration in seconds to human readable string
 */
function formatDuration(seconds: number | null): string {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Format scheduled time for display
 */
function formatScheduledTime(isoString: string | null | undefined): string {
  if (!isoString) return "Not scheduled";
  try {
    const date = parseISO(isoString);
    return format(date, "MMM d 'at' h:mm a");
  } catch {
    return "Invalid date";
  }
}

/**
 * Get human readable failure reason
 */
function getFailureReason(endedReason: string | null | undefined): string {
  if (!endedReason) return "Unknown error";

  const reasonMap: Record<string, string> = {
    "customer-did-not-answer": "No answer",
    "dial-no-answer": "No answer",
    "silence-timed-out": "No response during call",
    "voicemail-detected": "Reached voicemail",
    "failed-to-connect": "Connection failed",
    "customer-busy": "Line busy",
    "machine-detected": "Voicemail detected",
  };

  return reasonMap[endedReason] ?? endedReason.replace(/-/g, " ");
}

/**
 * DeliveryStatusHero - Visual status indicator at top of detail panel
 *
 * Shows the current delivery state prominently with:
 * - Clear status badge
 * - Phone/Email delivery status
 * - Scheduled times or completion info
 */
export function DeliveryStatusHero({
  status,
  emailStatus,
  phoneStatus,
  scheduledEmailFor,
  scheduledCallFor,
  scheduledCall,
  hasOwnerEmail,
  hasOwnerPhone,
  ownerPhone,
  ownerEmail,
}: DeliveryStatusHeroProps) {
  const deliveryState = getDeliveryState(status, emailStatus, phoneStatus);

  // Style configuration based on state
  const stateConfig = {
    unsent: {
      bgColor: "bg-slate-50 dark:bg-slate-900/50",
      borderColor: "border-slate-200 dark:border-slate-700",
      icon: Send,
      iconColor: "text-slate-500",
      title: "Ready to Send",
      titleColor: "text-slate-700 dark:text-slate-300",
    },
    scheduled: {
      bgColor: "bg-violet-50 dark:bg-violet-900/20",
      borderColor: "border-violet-200 dark:border-violet-800",
      icon: Clock,
      iconColor: "text-violet-600 dark:text-violet-400",
      title: "Scheduled",
      titleColor: "text-violet-700 dark:text-violet-300",
    },
    partial: {
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      borderColor: "border-amber-200 dark:border-amber-800",
      icon: AlertCircle,
      iconColor: "text-amber-600 dark:text-amber-400",
      title: "Partial Delivery",
      titleColor: "text-amber-700 dark:text-amber-300",
    },
    completed: {
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      title: "Delivery Complete",
      titleColor: "text-emerald-700 dark:text-emerald-300",
    },
    failed: {
      bgColor: "bg-red-50 dark:bg-red-900/20",
      borderColor: "border-red-200 dark:border-red-800",
      icon: XCircle,
      iconColor: "text-red-600 dark:text-red-400",
      title: "Delivery Failed",
      titleColor: "text-red-700 dark:text-red-300",
    },
  };

  const config = stateConfig[deliveryState];
  const StatusIcon = config.icon;

  // Determine phone status display
  const getPhoneStatusDisplay = () => {
    if (!hasOwnerPhone) {
      return { icon: "none", text: "No phone on file", color: "text-slate-400" };
    }
    if (phoneStatus === "sent") {
      const duration = scheduledCall?.durationSeconds;
      return {
        icon: "check",
        text: `Completed${duration ? ` (${formatDuration(duration)})` : ""}`,
        color: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (phoneStatus === "failed") {
      return {
        icon: "x",
        text: getFailureReason(scheduledCall?.endedReason),
        color: "text-red-600 dark:text-red-400",
      };
    }
    if (phoneStatus === "pending" && scheduledCallFor) {
      return {
        icon: "clock",
        text: formatScheduledTime(scheduledCallFor),
        color: "text-violet-600 dark:text-violet-400",
      };
    }
    return {
      icon: "pending",
      text: formatPhoneNumber(ownerPhone ?? null) ?? "Ready",
      color: "text-slate-500",
    };
  };

  // Determine email status display
  const getEmailStatusDisplay = () => {
    if (!hasOwnerEmail) {
      return { icon: "none", text: "No email on file", color: "text-slate-400" };
    }
    if (emailStatus === "sent") {
      return {
        icon: "check",
        text: "Sent",
        color: "text-emerald-600 dark:text-emerald-400",
      };
    }
    if (emailStatus === "failed") {
      return {
        icon: "x",
        text: "Delivery failed",
        color: "text-red-600 dark:text-red-400",
      };
    }
    if (emailStatus === "pending" && scheduledEmailFor) {
      return {
        icon: "clock",
        text: formatScheduledTime(scheduledEmailFor),
        color: "text-violet-600 dark:text-violet-400",
      };
    }
    return {
      icon: "pending",
      text: ownerEmail ?? "Ready",
      color: "text-slate-500",
    };
  };

  const phoneDisplay = getPhoneStatusDisplay();
  const emailDisplay = getEmailStatusDisplay();

  const StatusIndicator = ({
    icon,
    color,
  }: {
    icon: string;
    color: string;
  }) => {
    if (icon === "check")
      return <CheckCircle2 className={`h-3.5 w-3.5 ${color}`} />;
    if (icon === "x") return <XCircle className={`h-3.5 w-3.5 ${color}`} />;
    if (icon === "clock") return <Clock className={`h-3.5 w-3.5 ${color}`} />;
    if (icon === "none")
      return (
        <div className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-slate-300" />
      );
    return (
      <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300" />
    );
  };

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardContent className="p-4">
        {/* Status Header */}
        <div className="mb-3 flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${config.iconColor}`} />
          <span className={`text-sm font-semibold ${config.titleColor}`}>
            {config.title}
          </span>
        </div>

        {/* Delivery Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Phone Status */}
          <div className="flex items-start gap-2 rounded-lg bg-white/60 p-2.5 dark:bg-slate-800/40">
            <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <StatusIndicator
                  icon={phoneDisplay.icon}
                  color={phoneDisplay.color}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Phone
                </span>
              </div>
              <p
                className={`mt-0.5 truncate text-xs ${phoneDisplay.color}`}
                title={phoneDisplay.text}
              >
                {phoneDisplay.text}
              </p>
            </div>
          </div>

          {/* Email Status */}
          <div className="flex items-start gap-2 rounded-lg bg-white/60 p-2.5 dark:bg-slate-800/40">
            <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <StatusIndicator
                  icon={emailDisplay.icon}
                  color={emailDisplay.color}
                />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Email
                </span>
              </div>
              <p
                className={`mt-0.5 truncate text-xs ${emailDisplay.color}`}
                title={emailDisplay.text}
              >
                {emailDisplay.text}
              </p>
            </div>
          </div>
        </div>

        {/* Failure reason for failed state */}
        {deliveryState === "failed" && scheduledCall?.endedReason && (
          <div className="mt-3 rounded-md bg-red-100/50 p-2 dark:bg-red-900/30">
            <p className="text-xs text-red-700 dark:text-red-300">
              {getFailureReason(scheduledCall.endedReason)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

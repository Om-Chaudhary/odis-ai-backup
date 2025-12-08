import { Badge } from "@odis/ui/badge";
import { cn } from "~/lib/utils";
import type { CallStatus, EmailStatus } from "~/types/dashboard";
import { Loader2, CheckCircle2, XCircle, Clock, Phone } from "lucide-react";

interface DischargeStatusBadgeProps {
  status: CallStatus | EmailStatus;
  type: "call" | "email";
  className?: string;
}

export function DischargeStatusBadge({
  status,
  type: _type,
  className,
}: DischargeStatusBadgeProps) {
  // Default to "queued" if status is null/undefined to ensure badge is always visible
  const displayStatus = status ?? "queued";

  const getStatusConfig = (s: string) => {
    switch (s) {
      case "queued":
        return {
          label: "Queued",
          icon: Clock,
          variant: "outline" as const,
          className: "text-yellow-600 border-yellow-200 bg-yellow-50",
        };
      case "ringing":
        return {
          label: "Ringing",
          icon: Phone,
          variant: "outline" as const,
          className: "text-blue-600 border-blue-200 bg-blue-50 animate-pulse",
        };
      case "in_progress":
        return {
          label: "In Progress",
          icon: Loader2,
          variant: "default" as const,
          className: "bg-blue-600 animate-pulse",
        };
      case "completed":
      case "sent":
        return {
          label: s === "sent" ? "Sent" : "Completed",
          icon: CheckCircle2,
          variant: "default" as const,
          className: "bg-green-600 hover:bg-green-700",
        };
      case "failed":
        return {
          label: "Failed",
          icon: XCircle,
          variant: "destructive" as const,
          className: "",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          icon: XCircle,
          variant: "secondary" as const,
          className: "text-muted-foreground",
        };
      default:
        return {
          label: s,
          icon: undefined,
          variant: "secondary" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(displayStatus);
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("flex items-center gap-1.5", config.className, className)}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            displayStatus === "in_progress" && "animate-spin",
          )}
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}

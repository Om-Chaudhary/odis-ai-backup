/**
 * Shared status badge components for dashboard
 * Provides consistent styling and labels across inbound and outbound dashboards
 */

import { Badge } from "@odis-ai/ui/badge";
import { cn } from "@odis-ai/utils";
import { AlertTriangle } from "lucide-react";

// =============================================================================
// Call Status Badge
// =============================================================================

interface CallStatusBadgeProps {
  status: string;
  className?: string;
}

/**
 * Badge for call status (used in inbound calls)
 */
export function CallStatusBadge({ status, className }: CallStatusBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    queued: { label: "Queued", className: "bg-yellow-100 text-yellow-700" },
    ringing: { label: "Ringing", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "Active", className: "bg-green-100 text-green-700" },
    completed: {
      label: "Completed",
      className: "bg-emerald-100 text-emerald-700",
    },
    failed: { label: "Failed", className: "bg-red-100 text-red-700" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600" },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <Badge className={cn(variant.className, className)}>{variant.label}</Badge>
  );
}

// =============================================================================
// Sentiment Badge
// =============================================================================

interface SentimentBadgeProps {
  sentiment: string;
  className?: string;
}

/**
 * Badge for user sentiment analysis
 */
export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    positive: { label: "Positive", className: "bg-green-100 text-green-700" },
    neutral: { label: "Neutral", className: "bg-slate-100 text-slate-600" },
    negative: { label: "Negative", className: "bg-red-100 text-red-700" },
  };

  const variant = variants[sentiment];
  if (!variant) return null;

  return (
    <Badge className={cn(variant.className, className)}>{variant.label}</Badge>
  );
}

// =============================================================================
// Appointment Status Badge
// =============================================================================

interface AppointmentStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Badge for appointment status
 */
export function AppointmentStatusBadge({
  status,
  size = "md",
  className,
}: AppointmentStatusBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    confirmed: {
      label: "Confirmed",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      className: "bg-destructive/10 text-destructive",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-muted text-muted-foreground",
    },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full font-medium",
        variant.className,
        sizeClasses[size],
        className,
      )}
    >
      {variant.label}
    </span>
  );
}

// =============================================================================
// Message Status Badge
// =============================================================================

interface MessageStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Badge for message status
 */
export function MessageStatusBadge({
  status,
  size = "md",
  className,
}: MessageStatusBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    new: {
      label: "New",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    read: { label: "Read", className: "bg-muted text-muted-foreground" },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
  };

  const variant = variants[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full font-medium",
        variant.className,
        sizeClasses[size],
        className,
      )}
    >
      {variant.label}
    </span>
  );
}

// =============================================================================
// Priority Badge
// =============================================================================

interface PriorityBadgeProps {
  priority: string | null;
  className?: string;
}

/**
 * Badge for message priority
 */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  if (!priority || priority === "normal") {
    return <span className="text-muted-foreground text-xs">Normal</span>;
  }

  if (priority === "urgent") {
    return (
      <span
        className={cn(
          "bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          className,
        )}
      >
        <AlertTriangle className="h-3 w-3" />
        Urgent
      </span>
    );
  }

  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {priority}
    </span>
  );
}

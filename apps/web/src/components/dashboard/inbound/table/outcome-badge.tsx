/**
 * OutcomeBadge Component
 *
 * Displays call outcome as a styled badge with semantic colors
 * Based on the outcome field from inbound_vapi_calls table
 */

import { Badge } from "@odis-ai/shared/ui/badge";
import { cn } from "@odis-ai/shared/util";

interface OutcomeBadgeProps {
  outcome: string | null | undefined;
  className?: string;
}

/**
 * Maps outcome to badge variant and styling
 */
function getOutcomeStyle(outcome: string | null | undefined): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  switch (outcome) {
    case "Scheduled":
      return {
        variant: "default",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      };
    case "Completed":
      return {
        variant: "default",
        className: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
      };
    case "Info":
      return {
        variant: "secondary",
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
      };
    case "Call Back":
      return {
        variant: "secondary",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      };
    case "Emergency":
      return {
        variant: "destructive",
        className: "bg-red-500/15 text-red-700 dark:text-red-400",
      };
    case "Cancellation":
      return {
        variant: "outline",
        className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      };
    default:
      return {
        variant: "outline",
        className: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
      };
  }
}

/**
 * Badge component displaying call outcome with semantic colors
 */
export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps) {
  const { className: styleClassName } = getOutcomeStyle(outcome);

  // Don't render if no outcome
  if (!outcome) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-2 py-0.5 text-xs font-medium",
        styleClassName,
        className,
      )}
    >
      {outcome}
    </Badge>
  );
}

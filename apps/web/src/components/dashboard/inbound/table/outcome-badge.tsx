/**
 * OutcomeBadge Component
 *
 * Displays call outcome as a styled badge with semantic colors
 * Uses structured data from call_outcome_data for descriptive outcomes
 */

import { Badge } from "@odis-ai/shared/ui/badge";
import { cn } from "@odis-ai/shared/util";
import type { Database } from "@odis-ai/shared/types";
import { getDescriptiveOutcome } from "../utils/get-descriptive-outcome";
import { isNoResponseCall } from "../utils/is-no-response-call";

// Accept both Database type and our custom InboundCall type
type InboundCallData =
  Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface OutcomeBadgeProps {
  call: InboundCallData;
  className?: string;
  /** Show full description instead of label (for detail views) */
  showDescription?: boolean;
}

/**
 * Maps outcome variant to badge styling
 */
function getVariantStyle(
  variant:
    | "urgent"
    | "emergency"
    | "callback"
    | "scheduled"
    | "info"
    | "completed"
    | "cancelled"
    | "default",
): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  switch (variant) {
    case "emergency":
      return {
        variant: "destructive",
        className:
          "bg-orange-500/20 text-orange-700 dark:text-orange-400 font-semibold",
      };
    case "urgent":
      return {
        variant: "destructive",
        className: "bg-red-500/15 text-red-700 dark:text-red-400",
      };
    case "callback":
      return {
        variant: "secondary",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      };
    case "scheduled":
      return {
        variant: "default",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      };
    case "completed":
      return {
        variant: "default",
        className: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
      };
    case "cancelled":
      return {
        variant: "outline",
        className: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
      };
    case "info":
      return {
        variant: "secondary",
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
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
export function OutcomeBadge({
  call,
  className,
  showDescription = false,
}: OutcomeBadgeProps) {
  // Don't display badge for no-response calls (leaves outcome column blank)
  if (isNoResponseCall(call)) {
    return null;
  }

  const outcome = getDescriptiveOutcome(call);
  const { className: styleClassName } = getVariantStyle(outcome.variant);

  // Text to display - use description for detail views, label for table
  const displayText =
    showDescription && outcome.description
      ? outcome.description
      : outcome.label;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent px-2 py-0.5 text-xs font-medium",
        styleClassName,
        showDescription && "text-left whitespace-normal", // Allow wrapping for descriptions
        className,
      )}
    >
      {displayText}
    </Badge>
  );
}

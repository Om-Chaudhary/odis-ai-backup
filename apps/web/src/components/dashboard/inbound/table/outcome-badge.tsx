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
  variant: "emergency" | "appointment" | "callback" | "info" | "blank",
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
    case "appointment":
      return {
        variant: "default",
        className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
      };
    case "callback":
      return {
        variant: "secondary",
        className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
      };
    case "info":
      return {
        variant: "secondary",
        className: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
      };
    case "blank":
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
  // Show em dash for no-response calls
  if (isNoResponseCall(call)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const outcome = getDescriptiveOutcome(call);

  // Show em dash if outcome is null (doesn't match any category)
  if (!outcome) {
    return <span className="text-muted-foreground">—</span>;
  }

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

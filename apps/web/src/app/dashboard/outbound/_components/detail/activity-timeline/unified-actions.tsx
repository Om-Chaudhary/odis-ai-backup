import { Button } from "@odis-ai/shared/ui/button";
import { Clock, Zap } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface UnifiedActionsProps {
  emailEnabled: boolean;
  phoneEnabled: boolean;
  hasEmailContact: boolean;
  hasPhoneContact: boolean;
  onSchedule: () => void;
  onSendNow: () => void;
  isSubmitting: boolean;
}

/**
 * Unified action buttons for scheduling/sending communications
 * Appears below the timeline with a divider
 * Operates on whichever channels are enabled (email, phone, or both)
 */
export function UnifiedActions({
  emailEnabled,
  phoneEnabled,
  hasEmailContact,
  hasPhoneContact,
  onSchedule,
  onSendNow,
  isSubmitting,
}: UnifiedActionsProps) {
  // Determine if any action is enabled
  const hasEnabledChannel =
    (emailEnabled && hasEmailContact) || (phoneEnabled && hasPhoneContact);

  if (!hasEnabledChannel) {
    return null;
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onSchedule}
          disabled={isSubmitting}
          variant="outline"
          className={cn(
            "h-9 gap-1.5 text-sm font-normal transition-all",
            "border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:text-blue-800",
            "dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isSubmitting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>...</span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5" />
              <span>Schedule</span>
            </>
          )}
        </Button>
        <Button
          onClick={onSendNow}
          disabled={isSubmitting}
          variant="outline"
          className={cn(
            "h-9 gap-1.5 text-sm font-normal transition-all",
            "border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800",
            "dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isSubmitting ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>...</span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" />
              <span>Send Now</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { Phone, Mail } from "lucide-react";
import { cn } from "@odis-ai/shared/util";
import type { ChannelSchedulerProps } from "./types";

/**
 * Channel toggle control for "not started" events
 * Shows checkbox and contact info only - action buttons are now unified below timeline
 */
export function ChannelScheduler({
  channel,
  contactInfo,
  isEnabled,
  onToggle,
  isSubmitting,
}: ChannelSchedulerProps) {
  const ChannelIcon = channel === "email" ? Mail : Phone;
  const channelLabel = channel === "email" ? "Email" : "Phone Call";

  return (
    <div className="mt-2">
      {/* Channel Toggle */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg p-3 transition-all",
          isEnabled && contactInfo
            ? "bg-blue-50/50 ring-1 ring-blue-200/50 dark:bg-blue-950/30 dark:ring-blue-800/50"
            : "bg-slate-50/50 dark:bg-slate-800/50",
        )}
      >
        <Checkbox
          id={`${channel}-toggle`}
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={!contactInfo || isSubmitting}
          className="mt-0.5"
        />
        <div className="flex flex-1 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 dark:bg-slate-700/50">
            <ChannelIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor={`${channel}-toggle`}
              className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {channelLabel}
            </label>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {contactInfo ?? "No contact info available"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

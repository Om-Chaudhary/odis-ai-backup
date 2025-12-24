/**
 * SyncFutureAppointmentsButton Component for Popup
 *
 * Syncs future scheduled/confirmed appointments for availability checking.
 * These appointments populate the appointments table for VAPI availability queries.
 */

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@odis-ai/shared/ui/extension";
import {
  useFutureAppointmentsSync,
  getFuturePresetLabel,
} from "../../hooks/useFutureAppointmentsSync";
import {
  CalendarPlus,
  ChevronDown,
  Loader2,
  CalendarDays,
  CalendarRange,
  CalendarClock,
} from "lucide-react";
import { useCallback } from "react";
import type { FutureSyncPreset } from "../../hooks/useFutureAppointmentsSync";

const PRESETS: { id: FutureSyncPreset; icon: typeof CalendarDays }[] = [
  { id: "next7days", icon: CalendarDays },
  { id: "next14days", icon: CalendarRange },
  { id: "next30days", icon: CalendarClock },
];

/**
 * Get short label for button display during sync
 */
const getShortLabel = (preset: FutureSyncPreset): string => {
  switch (preset) {
    case "next7days":
      return "Next 7 Days";
    case "next14days":
      return "Next 14 Days";
    case "next30days":
      return "Next 30 Days";
  }
};

/**
 * SyncFutureAppointmentsButton component for popup
 */
export const SyncFutureAppointmentsButton = () => {
  const { quickSync, isLoading, currentPreset, lastSyncResult } =
    useFutureAppointmentsSync();

  const handleQuickSync = useCallback(
    async (preset: FutureSyncPreset) => {
      try {
        const result = await quickSync(preset);

        // Show success message
        const lines = [
          `Future Schedule Sync Complete!`,
          ``,
          `${getShortLabel(preset)}:`,
        ];
        lines.push(`- ${result.created} appointments synced`);

        if (result.failed > 0) {
          lines.push(`- ${result.failed} failed`);
        }

        lines.push(`Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
        lines.push(``, `VAPI can now check availability for these dates!`);

        alert(lines.join("\n"));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        alert(`Future schedule sync failed\n\n${errorMessage}`);
      }
    },
    [quickSync],
  );

  // Button text based on state
  const getButtonText = () => {
    if (isLoading && currentPreset) {
      return `Syncing ${getShortLabel(currentPreset)}...`;
    }
    return "Sync Future Schedule";
  };

  // Summary badge from last result
  const getBadgeText = () => {
    if (!lastSyncResult || isLoading) return null;
    return `${lastSyncResult.created}`;
  };

  const badgeText = getBadgeText();

  return (
    <div className="border-border bg-card border-b px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarPlus className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{getButtonText()}</span>
              {badgeText && !isLoading && (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                  {badgeText}
                </span>
              )}
              {!isLoading && <ChevronDown className="h-3 w-3 opacity-70" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="border-border text-card-foreground !bg-opacity-100 dark:!bg-opacity-100 w-56 border !bg-white shadow-lg backdrop-blur-none dark:!bg-slate-900"
            style={{
              backgroundColor: "#fff",
              opacity: 1,
              backdropFilter: "none",
            }}
          >
            {PRESETS.map(({ id, icon: Icon }) => (
              <DropdownMenuItem
                key={id}
                onClick={() => void handleQuickSync(id)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{getFuturePresetLabel(id)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

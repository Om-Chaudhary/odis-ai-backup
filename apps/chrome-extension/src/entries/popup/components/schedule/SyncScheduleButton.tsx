/**
 * SyncScheduleButton Component for Popup
 *
 * Quick sync dropdown with preset date ranges.
 * Combines schedule sync + notes reconciliation into a single action.
 */

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@odis-ai/ui/extension';
import { useScheduleSync, getPresetLabel } from '../../hooks/useScheduleSync';
import { RefreshCw, ChevronDown, Loader2, Calendar, CalendarDays, CalendarRange, CalendarClock } from 'lucide-react';
import { useCallback } from 'react';
import type { QuickSyncPreset } from '../../hooks/useScheduleSync';

const PRESETS: { id: QuickSyncPreset; icon: typeof Calendar }[] = [
  { id: 'today', icon: Calendar },
  { id: 'yesterday', icon: CalendarDays },
  { id: 'last3days', icon: CalendarRange },
  { id: 'lastweek', icon: CalendarClock },
];

/**
 * Get short label for button display during sync
 */
const getShortLabel = (preset: QuickSyncPreset): string => {
  switch (preset) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case 'last3days':
      return 'Last 3 Days';
    case 'lastweek':
      return 'Last Week';
  }
};

/**
 * Main SyncScheduleButton component for popup
 */
export const SyncScheduleButton = () => {
  const { quickSync, isLoading, currentPreset, lastQuickSyncResult } = useScheduleSync();

  const handleQuickSync = useCallback(
    async (preset: QuickSyncPreset) => {
      try {
        const result = await quickSync(preset);

        // Show success message
        const message = `Quick Sync Complete!

${getShortLabel(preset)}:
- ${result.sync.created} appointments synced
- ${result.reconcile.reconciledCount} notes reconciled
${result.sync.deleted > 0 ? `- ${result.sync.deleted} no-shows removed\n` : ''}${result.sync.failed > 0 ? `- ${result.sync.failed} failed` : ''}
Duration: ${(result.totalDurationMs / 1000).toFixed(1)}s`;

        alert(message);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Quick sync failed\n\n${errorMessage}`);
      }
    },
    [quickSync],
  );

  // Button text based on state
  const getButtonText = () => {
    if (isLoading && currentPreset) {
      return `Syncing ${getShortLabel(currentPreset)}...`;
    }
    return 'Quick Sync';
  };

  // Summary badge from last result
  const getBadgeText = () => {
    if (!lastQuickSyncResult || isLoading) return null;
    const { sync, reconcile } = lastQuickSyncResult;
    return `${sync.created}/${reconcile.reconciledCount}`;
  };

  const badgeText = getBadgeText();

  return (
    <div className="border-border bg-card border-b px-4 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <Button variant="default" size="sm" className="flex items-center gap-2" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="text-sm font-medium">{getButtonText()}</span>
              {badgeText && !isLoading && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{badgeText}</span>
              )}
              {!isLoading && <ChevronDown className="h-3 w-3 opacity-70" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="border-border text-card-foreground w-56 border !bg-white !bg-opacity-100 shadow-lg backdrop-blur-none dark:!bg-slate-900 dark:!bg-opacity-100"
            style={{ backgroundColor: '#fff', opacity: 1, backdropFilter: 'none' }}>
            {PRESETS.map(({ id, icon: Icon }) => (
              <DropdownMenuItem key={id} onClick={() => void handleQuickSync(id)} className="cursor-pointer">
                <Icon className="mr-2 h-4 w-4" />
                <span>{getPresetLabel(id)}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

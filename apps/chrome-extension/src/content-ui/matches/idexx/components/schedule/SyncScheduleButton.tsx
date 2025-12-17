/**
 * SyncScheduleButton Component
 *
 * A clean, modular UI component for IDEXX schedule sync operations.
 * Syncs appointments including consultation data (notes + products/services).
 * Uses the useScheduleSync hook for state management and shadcn/ui for styling.
 */

import { DateRangePicker } from './DateRangePicker';
import { useScheduleSync } from '../../hooks/useScheduleSync';
import { Button, AuthGuard } from '@odis-ai/ui/extension';
import { useState, useCallback } from 'react';
import type { DateRange } from './DateRangePicker';

/**
 * Simple SVG icons to avoid lucide-react dependency issues in content scripts
 */
const SyncIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 21h5v-5" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
  </svg>
);

/**
 * Format a date for display
 */
const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/**
 * Main SyncScheduleButton component
 */
export const SyncScheduleButton = () => {
  const [showPicker, setShowPicker] = useState(false);

  const { syncSchedule, isSyncing, isLoading, progress, lastSyncResult } = useScheduleSync();

  const openPicker = useCallback(() => {
    setShowPicker(true);
  }, []);

  const closePicker = useCallback(() => {
    setShowPicker(false);
  }, []);

  const handleSync = useCallback(
    async (range: DateRange) => {
      setShowPicker(false);

      try {
        const result = await syncSchedule(range.startDate, range.endDate);

        // Show success message (could be replaced with toast)
        const message = `Successfully synced ${result.created} appointments!

Date Range: ${formatDate(range.startDate)} → ${formatDate(range.endDate)}

Patients: ${result.patientsCreated} created, ${result.patientsUpdated} updated
Cases: ${result.created} created/updated
Consultation Data: ${result.notesReconciled} reconciled${result.deleted > 0 ? `\nNo-Shows Removed: ${result.deleted}` : ''}${result.failed > 0 ? `\n\n${result.failed} appointments failed to sync.` : ''}

Duration: ${(result.durationMs / 1000).toFixed(1)}s`;

        alert(message);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Schedule sync failed\n\n${errorMessage}`);
      }
    },
    [syncSchedule],
  );

  // Unauthenticated state
  const UnauthenticatedButton = (
    <Button
      variant="secondary"
      onClick={() => alert('Please click the OdisAI extension icon in your browser toolbar to sign in.')}
      className="gap-2">
      <LockIcon className="h-4 w-4" />
      Sign in to Sync
    </Button>
  );

  // Get button text based on state
  const getSyncButtonText = () => {
    if (isSyncing && progress) {
      return `${progress.current}/${progress.total}`;
    }
    if (isSyncing) {
      return 'Syncing...';
    }
    return 'Sync Schedule';
  };

  return (
    <AuthGuard fallback={UnauthenticatedButton}>
      <div className="relative">
        {/* Date Picker Modal */}
        {showPicker && !isLoading && (
          <DateRangePicker
            title="Sync Schedule"
            description="Choose the date range for appointments to sync (includes notes + products/services)"
            actionLabel="Sync"
            actionVariant="default"
            isLoading={isLoading}
            onAction={handleSync}
            onClose={closePicker}
          />
        )}

        {/* Sync Schedule Button */}
        <Button variant="default" onClick={openPicker} disabled={isLoading} className="gap-2">
          {isSyncing ? <SpinnerIcon className="h-4 w-4" /> : <SyncIcon className="h-4 w-4" />}
          {getSyncButtonText()}
          {lastSyncResult && !isSyncing && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{lastSyncResult.created}</span>
          )}
        </Button>
      </div>
    </AuthGuard>
  );
};

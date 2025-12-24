/**
 * useScheduleSync Hook for Popup
 *
 * A simplified version of the schedule sync hook that works in the popup context.
 * Sends messages to the background script, which forwards to the IDEXX content script.
 */

import { logger } from '@odis-ai/extension/shared';
import { useState, useCallback } from 'react';

export interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  /** Number of no-show cases that were deleted */
  deleted: number;
  patientsCreated: number;
  patientsUpdated: number;
  /** Number of cases where clinical notes were successfully fetched */
  notesReconciled: number;
  /** Number of cases where clinical notes fetch failed (non-fatal) */
  notesFailed: number;
  durationMs: number;
  error?: string;
}

export interface ReconcileResult {
  success: boolean;
  totalCases: number;
  reconciledCount: number;
  skippedCount: number;
  failedCount: number;
  durationMs: number;
  error?: string;
}

export interface QuickSyncResult {
  success: boolean;
  sync: SyncResult;
  reconcile: ReconcileResult;
  totalDurationMs: number;
}

export type QuickSyncPreset = 'today' | 'yesterday' | 'last3days' | 'lastweek';

/**
 * Get date range for a quick sync preset
 */
export const getDateRangeForPreset = (preset: QuickSyncPreset): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date;

  switch (preset) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yesterday': {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(startDate);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: yesterdayEnd };
    }
    case 'last3days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 2);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'lastweek':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return { startDate, endDate };
};

/**
 * Get human-readable label for a preset
 */
export const getPresetLabel = (preset: QuickSyncPreset): string => {
  const { startDate, endDate } = getDateRangeForPreset(preset);
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  switch (preset) {
    case 'today':
      return `Today (${formatDate(startDate)})`;
    case 'yesterday':
      return `Yesterday (${formatDate(startDate)})`;
    case 'last3days':
      return `Last 3 Days (${formatDate(startDate)} - ${formatDate(endDate)})`;
    case 'lastweek':
      return `Last Week (${formatDate(startDate)} - ${formatDate(endDate)})`;
  }
};

export interface UseScheduleSyncReturn {
  /** Sync appointments from IDEXX for a date range */
  syncSchedule: (startDate: Date, endDate: Date) => Promise<SyncResult>;
  /** Reconcile consultation notes for previously synced cases */
  reconcileNotes: (startDate: Date, endDate: Date) => Promise<ReconcileResult>;
  /** Quick sync: chains schedule sync + notes reconciliation for a preset date range */
  quickSync: (preset: QuickSyncPreset) => Promise<QuickSyncResult>;
  /** Whether a sync or reconcile operation is in progress */
  isLoading: boolean;
  /** Whether a sync operation is in progress */
  isSyncing: boolean;
  /** Whether a reconcile operation is in progress */
  isReconciling: boolean;
  /** Current preset being synced (for UI feedback) */
  currentPreset: QuickSyncPreset | null;
  /** Result of the last sync operation */
  lastSyncResult: SyncResult | null;
  /** Result of the last reconcile operation */
  lastReconcileResult: ReconcileResult | null;
  /** Result of the last quick sync operation */
  lastQuickSyncResult: QuickSyncResult | null;
  /** Last error that occurred */
  error: Error | null;
  /** Clear the last error */
  clearError: () => void;
}

/**
 * Hook for managing IDEXX schedule sync operations from the popup.
 * Communicates with the background script to perform syncs.
 */
export const useScheduleSync = (): UseScheduleSyncReturn => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<QuickSyncPreset | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastReconcileResult, setLastReconcileResult] = useState<ReconcileResult | null>(null);
  const [lastQuickSyncResult, setLastQuickSyncResult] = useState<QuickSyncResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const syncSchedule = useCallback(async (startDate: Date, endDate: Date): Promise<SyncResult> => {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date.');
    }

    setIsSyncing(true);
    setError(null);

    try {
      logger.info('Requesting schedule sync via background script', { startDate, endDate });

      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_SCHEDULE',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Handle chrome.runtime.lastError
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message || 'Failed to communicate with extension';
        logger.error('Chrome runtime error during schedule sync', { error: errorMessage });
        throw new Error(errorMessage);
      }

      if (!response || !response.success) {
        const errorMessage = response?.error || 'Unknown error occurred';
        logger.error('Schedule sync failed', { error: errorMessage });
        throw new Error(errorMessage);
      }

      logger.info('Schedule sync completed successfully', response);

      // Extract result from nested response structure
      const syncResult = response.result || response;

      const result: SyncResult = {
        success: true,
        created: syncResult.created || 0,
        updated: syncResult.updated || 0,
        failed: syncResult.failed || 0,
        deleted: syncResult.deleted || 0,
        patientsCreated: syncResult.patientsCreated || 0,
        patientsUpdated: syncResult.patientsUpdated || 0,
        notesReconciled: syncResult.notesReconciled || 0,
        notesFailed: syncResult.notesFailed || 0,
        durationMs: syncResult.durationMs || 0,
      };

      setLastSyncResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setError(error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const reconcileNotes = useCallback(async (startDate: Date, endDate: Date): Promise<ReconcileResult> => {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date.');
    }

    setIsReconciling(true);
    setError(null);

    try {
      logger.info('Requesting notes reconciliation via background script', { startDate, endDate });

      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        type: 'RECONCILE_NOTES',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      // Handle chrome.runtime.lastError
      if (chrome.runtime.lastError) {
        const errorMessage = chrome.runtime.lastError.message || 'Failed to communicate with extension';
        logger.error('Chrome runtime error during notes reconciliation', { error: errorMessage });
        throw new Error(errorMessage);
      }

      if (!response || !response.success) {
        const errorMessage = response?.error || 'Unknown error occurred';
        logger.error('Notes reconciliation failed', { error: errorMessage });
        throw new Error(errorMessage);
      }

      logger.info('Notes reconciliation completed successfully', response);

      const result: ReconcileResult = {
        success: true,
        totalCases: response.totalCases || 0,
        reconciledCount: response.reconciledCount || 0,
        skippedCount: response.skippedCount || 0,
        failedCount: response.failedCount || 0,
        durationMs: response.durationMs || 0,
      };

      setLastReconcileResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Reconciliation failed');
      setError(error);
      throw error;
    } finally {
      setIsReconciling(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Quick sync: chains schedule sync + notes reconciliation for a preset date range
   */
  const quickSync = useCallback(
    async (preset: QuickSyncPreset): Promise<QuickSyncResult> => {
      const startTime = Date.now();
      const { startDate, endDate } = getDateRangeForPreset(preset);

      setCurrentPreset(preset);
      setError(null);

      try {
        logger.info('Starting quick sync', { preset, startDate, endDate });

        // Step 1: Sync schedule
        const syncResult = await syncSchedule(startDate, endDate);

        // Step 2: Reconcile notes
        const reconcileResult = await reconcileNotes(startDate, endDate);

        const result: QuickSyncResult = {
          success: true,
          sync: syncResult,
          reconcile: reconcileResult,
          totalDurationMs: Date.now() - startTime,
        };

        setLastQuickSyncResult(result);
        logger.info('Quick sync completed', { preset, result });

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Quick sync failed');
        setError(error);
        throw error;
      } finally {
        setCurrentPreset(null);
      }
    },
    [syncSchedule, reconcileNotes],
  );

  return {
    syncSchedule,
    reconcileNotes,
    quickSync,
    isLoading: isSyncing || isReconciling,
    isSyncing,
    isReconciling,
    currentPreset,
    lastSyncResult,
    lastReconcileResult,
    lastQuickSyncResult,
    error,
    clearError,
  };
};

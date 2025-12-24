/**
 * useScheduleSync Hook
 *
 * A React hook that provides a clean interface for schedule sync operations.
 * Wraps the ScheduleSyncService and manages React state automatically.
 *
 * @example
 * ```tsx
 * const { syncSchedule, isSyncing, lastSyncResult } = useScheduleSync();
 *
 * const handleSync = async () => {
 *   try {
 *     await syncSchedule(startDate, endDate);
 *   } catch (error) {
 *     console.error('Sync failed:', error);
 *   }
 * };
 * ```
 */

import { idexxApiClient } from "../services/api/idexx-api-client";
import { ScheduleSyncService } from "../services/schedule-sync-service";
import { getSupabaseClient, useAuth } from "@odis-ai/extension/shared";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type {
  SyncProgress,
  SyncResult,
  ReconciliationResult,
} from "../services/schedule-sync-service";

export interface UseScheduleSyncReturn {
  /** Sync appointments from IDEXX for a date range */
  syncSchedule: (startDate: Date, endDate: Date) => Promise<SyncResult>;
  /** Reconcile consultation notes for previously synced cases */
  reconcileNotes: (
    startDate: Date,
    endDate: Date,
  ) => Promise<ReconciliationResult>;
  /** Whether a sync or reconcile operation is in progress */
  isLoading: boolean;
  /** Whether a sync operation is in progress */
  isSyncing: boolean;
  /** Whether a reconcile operation is in progress */
  isReconciling: boolean;
  /** Current progress of the operation */
  progress: SyncProgress | null;
  /** Result of the last sync operation */
  lastSyncResult: SyncResult | null;
  /** Result of the last reconcile operation */
  lastReconcileResult: ReconciliationResult | null;
  /** Last error that occurred */
  error: Error | null;
  /** Clear the last error */
  clearError: () => void;
  /** Reset all state */
  reset: () => void;
}

/**
 * Hook for managing IDEXX schedule sync operations.
 *
 * Features:
 * - Prevents concurrent operations (race condition protection)
 * - Handles cleanup on unmount (prevents memory leaks)
 * - Provides loading states and progress tracking
 * - Manages error state
 */
export const useScheduleSync = (): UseScheduleSyncReturn => {
  const { session } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastReconcileResult, setLastReconcileResult] =
    useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track if an operation is in progress (for race condition prevention)
  const operationInProgressRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create service instance when we have a session
  const service = useMemo(() => {
    if (!session?.user?.id) return null;

    const supabase = getSupabaseClient();
    return new ScheduleSyncService(idexxApiClient, supabase, session.user.id);
  }, [session?.user?.id]);

  // Safe state setter that checks mounted state
  const safeSetProgress = useCallback((value: SyncProgress | null) => {
    if (isMountedRef.current) setProgress(value);
  }, []);

  const safeSetIsSyncing = useCallback((value: boolean) => {
    if (isMountedRef.current) setIsSyncing(value);
  }, []);

  const safeSetIsReconciling = useCallback((value: boolean) => {
    if (isMountedRef.current) setIsReconciling(value);
  }, []);

  const safeSetError = useCallback((value: Error | null) => {
    if (isMountedRef.current) setError(value);
  }, []);

  const safeSetLastSyncResult = useCallback((value: SyncResult | null) => {
    if (isMountedRef.current) setLastSyncResult(value);
  }, []);

  const safeSetLastReconcileResult = useCallback(
    (value: ReconciliationResult | null) => {
      if (isMountedRef.current) setLastReconcileResult(value);
    },
    [],
  );

  const syncSchedule = useCallback(
    async (startDate: Date, endDate: Date): Promise<SyncResult> => {
      if (!service) {
        throw new Error("Not authenticated. Please sign in to sync schedule.");
      }

      if (operationInProgressRef.current) {
        throw new Error(
          "Another operation is already in progress. Please wait.",
        );
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before end date.");
      }

      operationInProgressRef.current = true;
      safeSetIsSyncing(true);
      safeSetError(null);
      safeSetProgress(null);

      try {
        const result = await service.syncSchedule({
          startDate,
          endDate,
          onProgress: safeSetProgress,
        });

        safeSetLastSyncResult(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Sync failed");
        safeSetError(error);
        throw error;
      } finally {
        operationInProgressRef.current = false;
        safeSetIsSyncing(false);
      }
    },
    [
      service,
      safeSetIsSyncing,
      safeSetError,
      safeSetProgress,
      safeSetLastSyncResult,
    ],
  );

  const reconcileNotes = useCallback(
    async (startDate: Date, endDate: Date): Promise<ReconciliationResult> => {
      if (!service) {
        throw new Error(
          "Not authenticated. Please sign in to reconcile notes.",
        );
      }

      if (operationInProgressRef.current) {
        throw new Error(
          "Another operation is already in progress. Please wait.",
        );
      }

      if (startDate > endDate) {
        throw new Error("Start date must be before end date.");
      }

      operationInProgressRef.current = true;
      safeSetIsReconciling(true);
      safeSetError(null);
      safeSetProgress(null);

      try {
        const result = await service.reconcileNotes({
          startDate,
          endDate,
          skipAlreadyReconciled: true,
          onProgress: safeSetProgress,
        });

        safeSetLastReconcileResult(result);
        return result;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Reconciliation failed");
        safeSetError(error);
        throw error;
      } finally {
        operationInProgressRef.current = false;
        safeSetIsReconciling(false);
      }
    },
    [
      service,
      safeSetIsReconciling,
      safeSetError,
      safeSetProgress,
      safeSetLastReconcileResult,
    ],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    if (!operationInProgressRef.current) {
      setIsSyncing(false);
      setIsReconciling(false);
      setProgress(null);
      setLastSyncResult(null);
      setLastReconcileResult(null);
      setError(null);
    }
  }, []);

  return {
    syncSchedule,
    reconcileNotes,
    isLoading: isSyncing || isReconciling,
    isSyncing,
    isReconciling,
    progress,
    lastSyncResult,
    lastReconcileResult,
    error,
    clearError,
    reset,
  };
};

export type { SyncProgress, SyncResult, ReconciliationResult };

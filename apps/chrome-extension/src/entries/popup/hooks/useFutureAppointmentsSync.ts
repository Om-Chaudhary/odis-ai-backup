/**
 * useFutureAppointmentsSync Hook for Popup
 *
 * Syncs future scheduled/confirmed appointments for availability checking.
 * Sends messages to the background script, which forwards to the IDEXX content script.
 */

import { logger } from "@odis-ai/extension/shared";
import { useState, useCallback } from "react";

export interface FutureSyncResult {
  success: boolean;
  total: number;
  created: number;
  failed: number;
  durationMs: number;
  error?: string;
}

export type FutureSyncPreset = "next7days" | "next14days" | "next30days";

/**
 * Get date range for a future sync preset
 */
export const getFutureDateRangeForPreset = (
  preset: FutureSyncPreset,
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(now);

  switch (preset) {
    case "next7days":
      endDate.setDate(endDate.getDate() + 7);
      break;
    case "next14days":
      endDate.setDate(endDate.getDate() + 14);
      break;
    case "next30days":
      endDate.setDate(endDate.getDate() + 30);
      break;
  }

  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

/**
 * Get human-readable label for a preset
 */
export const getFuturePresetLabel = (preset: FutureSyncPreset): string => {
  const { startDate, endDate } = getFutureDateRangeForPreset(preset);
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  switch (preset) {
    case "next7days":
      return `Next 7 Days (${formatDate(startDate)} - ${formatDate(endDate)})`;
    case "next14days":
      return `Next 14 Days (${formatDate(startDate)} - ${formatDate(endDate)})`;
    case "next30days":
      return `Next 30 Days (${formatDate(startDate)} - ${formatDate(endDate)})`;
  }
};

export interface UseFutureAppointmentsSyncReturn {
  /** Sync future appointments from IDEXX for a date range */
  syncFutureAppointments: (
    startDate: Date,
    endDate: Date,
  ) => Promise<FutureSyncResult>;
  /** Quick sync: sync future appointments for a preset date range */
  quickSync: (preset: FutureSyncPreset) => Promise<FutureSyncResult>;
  /** Whether a sync operation is in progress */
  isSyncing: boolean;
  /** Alias for isSyncing */
  isLoading: boolean;
  /** Current preset being synced (for UI feedback) */
  currentPreset: FutureSyncPreset | null;
  /** Result of the last sync operation */
  lastSyncResult: FutureSyncResult | null;
  /** Last error that occurred */
  error: Error | null;
  /** Clear the last error */
  clearError: () => void;
}

/**
 * Hook for managing future appointments sync operations from the popup.
 * Communicates with the background script to perform syncs.
 */
export const useFutureAppointmentsSync =
  (): UseFutureAppointmentsSyncReturn => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentPreset, setCurrentPreset] = useState<FutureSyncPreset | null>(
      null,
    );
    const [lastSyncResult, setLastSyncResult] =
      useState<FutureSyncResult | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const syncFutureAppointments = useCallback(
      async (startDate: Date, endDate: Date): Promise<FutureSyncResult> => {
        if (startDate > endDate) {
          throw new Error("Start date must be before end date.");
        }

        setIsSyncing(true);
        setError(null);

        try {
          logger.info(
            "Requesting future appointments sync via background script",
            { startDate, endDate },
          );

          // Send message to background script
          const response = await chrome.runtime.sendMessage({
            type: "SYNC_FUTURE_APPOINTMENTS",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

          // Handle chrome.runtime.lastError
          if (chrome.runtime.lastError) {
            const errorMessage =
              chrome.runtime.lastError.message ||
              "Failed to communicate with extension";
            logger.error(
              "Chrome runtime error during future appointments sync",
              { error: errorMessage },
            );
            throw new Error(errorMessage);
          }

          if (!response || !response.success) {
            const errorMessage = response?.error || "Unknown error occurred";
            logger.error("Future appointments sync failed", {
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }

          logger.info(
            "Future appointments sync completed successfully",
            response,
          );

          // Extract result from nested response structure
          const syncResult = response.result || response;

          const result: FutureSyncResult = {
            success: true,
            total: syncResult.total || 0,
            created: syncResult.created || 0,
            failed: syncResult.failed || 0,
            durationMs: syncResult.durationMs || 0,
          };

          setLastSyncResult(result);
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error("Sync failed");
          setError(error);
          throw error;
        } finally {
          setIsSyncing(false);
        }
      },
      [],
    );

    const clearError = useCallback(() => {
      setError(null);
    }, []);

    /**
     * Quick sync: sync future appointments for a preset date range
     */
    const quickSync = useCallback(
      async (preset: FutureSyncPreset): Promise<FutureSyncResult> => {
        const { startDate, endDate } = getFutureDateRangeForPreset(preset);

        setCurrentPreset(preset);
        setError(null);

        try {
          logger.info("Starting future appointments quick sync", {
            preset,
            startDate,
            endDate,
          });

          const result = await syncFutureAppointments(startDate, endDate);

          logger.info("Future appointments quick sync completed", {
            preset,
            result,
          });

          return result;
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Quick sync failed");
          setError(error);
          throw error;
        } finally {
          setCurrentPreset(null);
        }
      },
      [syncFutureAppointments],
    );

    return {
      syncFutureAppointments,
      quickSync,
      isSyncing,
      isLoading: isSyncing,
      currentPreset,
      lastSyncResult,
      error,
      clearError,
    };
  };

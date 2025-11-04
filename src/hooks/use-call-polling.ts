"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCallPollingOptions {
  /** Enable/disable polling */
  enabled?: boolean;
  /** Base polling interval in milliseconds (default: 5000) */
  interval?: number;
  /** Interval when no active calls (default: 30000) */
  idleInterval?: number;
  /** Callback to fetch data */
  onPoll: () => Promise<void>;
  /** Function to determine if there are active calls */
  hasActiveCalls?: () => boolean;
  /** Pause polling when tab is hidden (default: true) */
  pauseWhenHidden?: boolean;
}

export interface UseCallPollingReturn {
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Timestamp of last successful poll */
  lastUpdated: Date | null;
  /** Manually trigger a poll */
  refresh: () => Promise<void>;
  /** Whether a refresh is in progress */
  isRefreshing: boolean;
}

/**
 * Hook for intelligent polling with adaptive intervals and visibility handling
 *
 * Features:
 * - Adaptive polling based on active calls
 * - Pauses when tab is hidden
 * - Manual refresh capability
 * - Automatic cleanup
 */
export function useCallPolling({
  enabled = true,
  interval = 5000,
  idleInterval = 30000,
  onPoll,
  hasActiveCalls,
  pauseWhenHidden = true,
}: UseCallPollingOptions): UseCallPollingReturn {
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  // Handle visibility change
  useEffect(() => {
    if (!pauseWhenHidden) return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pauseWhenHidden]);

  // Poll function with debounce protection
  const poll = useCallback(async () => {
    if (isPollingRef.current) return; // Prevent concurrent polls

    isPollingRef.current = true;
    setIsRefreshing(true);

    try {
      await onPoll();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Polling error:", error);
    } finally {
      isPollingRef.current = false;
      setIsRefreshing(false);
    }
  }, [onPoll]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await poll();
  }, [poll]);

  // Setup polling interval
  useEffect(() => {
    if (!enabled || !isVisible) {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Determine interval based on active calls
    const currentInterval = hasActiveCalls?.() ? interval : idleInterval;

    setIsPolling(true);

    // Initial poll
    void poll();

    // Setup interval
    intervalRef.current = setInterval(() => {
      void poll();
    }, currentInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [enabled, isVisible, interval, idleInterval, hasActiveCalls, poll]);

  return {
    isPolling,
    lastUpdated,
    refresh,
    isRefreshing,
  };
}

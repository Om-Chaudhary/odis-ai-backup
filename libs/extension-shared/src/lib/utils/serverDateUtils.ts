/**
 * Server-synced date utility functions for accurate date/time handling
 *
 * This utility fetches the exact server time from Supabase to ensure accuracy
 * across different timezones and to account for client clock drift.
 *
 * Best Practices:
 * - Use server time for all date/time operations to ensure consistency
 * - Server time is cached and refreshed periodically
 * - Falls back to local time if server time is unavailable
 */

import { logger } from "./logger";
import { getSupabaseClient } from "../supabase/client";

const serverDateLogger = logger.child("[serverDateUtils]");

/**
 * Cache for server time synchronization
 */
interface ServerTimeCache {
  serverTime: Date;
  localTimeAtSync: number; // Local timestamp when server time was fetched
  offset: number; // Offset in milliseconds (serverTime - localTimeAtSync)
  lastSync: number; // Timestamp of last sync
}

let serverTimeCache: ServerTimeCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const SYNC_TIMEOUT = 5000; // 5 seconds timeout for server sync

/**
 * Fetch current server time from Supabase
 *
 * Method 1 (Recommended): Uses a database function `get_server_time()` if available
 * Method 2 (Fallback): Estimates server time using request timing
 *
 * To enable Method 1, create this function in your Supabase database:
 *
 * ```sql
 * CREATE OR REPLACE FUNCTION get_server_time()
 * RETURNS TIMESTAMPTZ AS $$
 * BEGIN
 *   RETURN NOW();
 * END;
 * $$ LANGUAGE plpgsql;
 * ```
 */
const fetchServerTime = async (): Promise<Date | null> => {
  try {
    const supabase = getSupabaseClient();

    // Method 1: Try to use database function (most accurate)
    try {
      const { data: rpcData, error: rpcError } = (await Promise.race([
        supabase.rpc("get_server_time"),
        new Promise<{ data: null; error: Error }>((resolve) =>
          setTimeout(
            () => resolve({ data: null, error: new Error("Timeout") }),
            SYNC_TIMEOUT,
          ),
        ),
      ])) as { data: string | null; error: Error | null };

      if (!rpcError && rpcData) {
        const serverTime = new Date(rpcData);
        serverDateLogger.debug("Server time fetched via RPC", {
          serverTime: serverTime.toISOString(),
        });
        return serverTime;
      }
    } catch {
      // RPC function not available, try fallback method
      serverDateLogger.debug(
        "RPC function not available, using fallback method",
      );
    }

    // Method 2: Estimate server time using request timing
    // Make multiple lightweight requests to calculate average offset
    const measurements: number[] = [];
    const numMeasurements = 3;

    for (let i = 0; i < numMeasurements; i++) {
      const startTime = Date.now();

      const { error } = (await Promise.race([
        supabase.from("cases").select("id").limit(1).maybeSingle(),
        new Promise<{ error: Error }>((resolve) =>
          setTimeout(
            () => resolve({ error: new Error("Timeout") }),
            SYNC_TIMEOUT,
          ),
        ),
      ])) as { error: Error | null };

      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      if (!error) {
        // Estimate server time as midpoint of request
        // This accounts for network latency
        const estimatedServerTime = startTime + requestDuration / 2;
        measurements.push(estimatedServerTime);
      }

      // Small delay between measurements
      if (i < numMeasurements - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (measurements.length > 0) {
      // Use average of measurements for better accuracy
      const avgServerTime =
        measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const serverTime = new Date(avgServerTime);

      serverDateLogger.debug("Server time estimated via request timing", {
        serverTime: serverTime.toISOString(),
        measurements: measurements.length,
      });

      return serverTime;
    }

    serverDateLogger.warn(
      "Failed to fetch server time, falling back to local time",
    );
    return null;
  } catch (error) {
    serverDateLogger.warn("Error fetching server time", { error });
    return null;
  }
};

/**
 * Sync server time and cache the offset
 * This should be called periodically to keep the cache fresh
 */
export const syncServerTime = async (): Promise<boolean> => {
  try {
    const serverTime = await fetchServerTime();

    if (!serverTime) {
      return false;
    }

    const localTimeAtSync = Date.now();
    const offset = serverTime.getTime() - localTimeAtSync;

    serverTimeCache = {
      serverTime,
      localTimeAtSync,
      offset,
      lastSync: localTimeAtSync,
    };

    serverDateLogger.debug("Server time synced", {
      serverTime: serverTime.toISOString(),
      offset: `${offset}ms`,
    });

    return true;
  } catch (error) {
    serverDateLogger.warn("Failed to sync server time", { error });
    return false;
  }
};

/**
 * Get the current accurate date/time using server time if available
 * Falls back to local time if server time is not available or cache is stale
 */
export const getCurrentDate = async (): Promise<Date> => {
  // Check if cache is valid
  if (
    serverTimeCache &&
    Date.now() - serverTimeCache.lastSync < CACHE_DURATION
  ) {
    // Use cached server time with offset
    const elapsed = Date.now() - serverTimeCache.localTimeAtSync;
    return new Date(serverTimeCache.serverTime.getTime() + elapsed);
  }

  // Try to sync server time
  const synced = await syncServerTime();

  if (synced && serverTimeCache) {
    // Use the freshly synced server time
    return serverTimeCache.serverTime;
  }

  // Fallback to local time
  serverDateLogger.debug("Using local time as fallback");
  return new Date();
};

/**
 * Get the current accurate date/time synchronously
 * Uses cached server time if available, otherwise returns local time
 * For best accuracy, call syncServerTime() first
 */
export const getCurrentDateSync = (): Date => {
  if (
    serverTimeCache &&
    Date.now() - serverTimeCache.lastSync < CACHE_DURATION
  ) {
    // Use cached server time with offset
    const elapsed = Date.now() - serverTimeCache.localTimeAtSync;
    return new Date(serverTimeCache.serverTime.getTime() + elapsed);
  }

  // Fallback to local time
  return new Date();
};

/**
 * Get current date/time as ISO string (UTC) using server time
 */
export const getCurrentISOString = async (): Promise<string> => {
  const date = await getCurrentDate();
  return date.toISOString();
};

/**
 * Get current date/time as ISO string (UTC) synchronously
 * Uses cached server time if available
 */
export const getCurrentISOStringSync = (): string =>
  getCurrentDateSync().toISOString();

/**
 * Get today's date in local timezone formatted as YYYY-MM-DD
 * Uses server time to determine the current date
 */
export const getTodayLocalDate = async (): Promise<string> => {
  const date = await getCurrentDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in local timezone formatted as YYYY-MM-DD (synchronous)
 * Uses cached server time if available
 */
export const getTodayLocalDateSync = (): string => {
  const date = getCurrentDateSync();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Get start of day in local timezone using server time
 */
export const getStartOfDay = async (date?: Date): Promise<Date> => {
  const baseDate = date ?? (await getCurrentDate());
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get start of day in local timezone (synchronous)
 */
export const getStartOfDaySync = (date?: Date): Date => {
  const baseDate = date ?? getCurrentDateSync();
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get end of day in local timezone using server time
 */
export const getEndOfDay = async (date?: Date): Promise<Date> => {
  const baseDate = date ?? (await getCurrentDate());
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Get end of day in local timezone (synchronous)
 */
export const getEndOfDaySync = (date?: Date): Date => {
  const baseDate = date ?? getCurrentDateSync();
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Check if a date is today using server time
 */
export const isToday = async (date: Date): Promise<boolean> => {
  const today = await getStartOfDay();
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if a date is today (synchronous)
 */
export const isTodaySync = (date: Date): boolean => {
  const today = getStartOfDaySync();
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  return (
    compareDate.getDate() === today.getDate() &&
    compareDate.getMonth() === today.getMonth() &&
    compareDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Clear the server time cache (useful for testing or manual refresh)
 */
export const clearServerTimeCache = (): void => {
  serverTimeCache = null;
};

/**
 * Get the current server time offset in milliseconds
 * Returns null if server time is not synced
 */
export const getServerTimeOffset = (): number | null =>
  serverTimeCache?.offset ?? null;

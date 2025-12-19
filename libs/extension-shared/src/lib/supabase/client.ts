import { logger } from "../utils/logger";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton pattern for Supabase client
let supabaseClient: SupabaseClient | null = null;

// Timeout for chrome.storage operations (5 seconds)
const STORAGE_TIMEOUT_MS = 5000;

/**
 * Wrap a promise with a timeout
 * Returns the fallback value if timeout is reached
 */
function withStorageTimeout<T>(
  promise: Promise<T>,
  fallbackValue: T,
  operationName: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      logger.warn(
        `[Supabase Storage] ${operationName} timed out after ${STORAGE_TIMEOUT_MS}ms`,
      );
      resolve(fallbackValue);
    }, STORAGE_TIMEOUT_MS);
  });

  return Promise.race([promise, timeoutPromise])
    .then((result) => {
      if (timeoutId) clearTimeout(timeoutId);
      return result;
    })
    .catch((error) => {
      if (timeoutId) clearTimeout(timeoutId);
      logger.error(`[Supabase Storage] ${operationName} error`, { error });
      return fallbackValue;
    });
}

/**
 * Custom storage adapter for Supabase that uses chrome.storage.local
 * This ensures auth sessions persist across extension contexts (popup, background, etc.)
 *
 * IMPORTANT: All operations have a 5-second timeout to prevent hanging.
 * If a timeout occurs, the operation returns a safe fallback value.
 */
const chromeStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const storagePromise = chrome.storage.local
        .get(key)
        .then((result) => (result[key] as string | undefined) ?? null);
      return await withStorageTimeout(storagePromise, null, `getItem(${key})`);
    } catch (error) {
      logger.error("[Supabase Storage] Error getting item", { error, key });
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const storagePromise = chrome.storage.local.set({ [key]: value });
      await withStorageTimeout(storagePromise, undefined, `setItem(${key})`);
    } catch (error) {
      logger.error("[Supabase Storage] Error setting item", { error, key });
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const storagePromise = chrome.storage.local.remove(key);
      await withStorageTimeout(storagePromise, undefined, `removeItem(${key})`);
    } catch (error) {
      logger.error("[Supabase Storage] Error removing item", { error, key });
    }
  },
};

/**
 * Get or create a Supabase client instance
 *
 * This uses a singleton pattern to ensure we only create one client instance
 * throughout the extension lifecycle (popup, background, content scripts, etc.)
 *
 * @returns Supabase client instance
 * @throws Error if Supabase URL or anon key is not configured
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.CEB_SUPABASE_URL;
  const supabaseAnonKey = process.env.CEB_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase configuration is missing. Please set CEB_SUPABASE_URL and CEB_SUPABASE_ANON_KEY in your .env file.",
    );
  }

  // Validate that these aren't the placeholder values
  if (
    supabaseUrl.includes("your-supabase") ||
    supabaseAnonKey.includes("your-supabase")
  ) {
    throw new Error(
      "Please replace placeholder Supabase values in .env with your actual Supabase project credentials.",
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Use chrome.storage for session persistence across extension contexts
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Extensions don't use URL-based auth flows by default
    },
  });

  return supabaseClient;
};

/**
 * Reset the Supabase client instance (useful for testing or re-initialization)
 */
export const resetSupabaseClient = (): void => {
  supabaseClient = null;
};

/**
 * Initialize Supabase client and return it
 * Alias for getSupabaseClient for more explicit initialization
 */
export const initSupabase = getSupabaseClient;

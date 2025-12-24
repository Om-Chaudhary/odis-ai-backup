import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthClientConfig, AuthStorageAdapter } from "./types";
import { detectStorageAdapter } from "./storage";

/**
 * Create a Supabase auth client for browser-based platforms.
 *
 * This client is designed for:
 * - Web applications (Next.js client-side)
 * - Chrome extensions (popup, options page)
 * - Electron renderer process
 *
 * @param config - Configuration with Supabase URL, anon key, and optional storage adapter
 * @returns Supabase client configured for the platform
 *
 * @example
 * ```ts
 * // Auto-detect storage (recommended)
 * const client = createBrowserAuthClient({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
 * });
 *
 * // Chrome extension with explicit storage
 * import { chromeStorageAdapter } from "@odis-ai/domain/auth/storage";
 * const client = createBrowserAuthClient({
 *   supabaseUrl: "...",
 *   supabaseAnonKey: "...",
 *   storage: chromeStorageAdapter,
 * });
 * ```
 */
export function createBrowserAuthClient(
  config: AuthClientConfig,
): SupabaseClient {
  const storage = config.storage ?? detectStorageAdapter();

  return createSupabaseClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => storage.getItem(key),
        setItem: (key: string, value: string) => storage.setItem(key, value),
        removeItem: (key: string) => storage.removeItem(key),
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Create a storage-adapted wrapper for Supabase auth storage
 */
export function createAuthStorage(adapter: AuthStorageAdapter) {
  return {
    getItem: (key: string) => adapter.getItem(key),
    setItem: (key: string, value: string) => adapter.setItem(key, value),
    removeItem: (key: string) => adapter.removeItem(key),
  };
}

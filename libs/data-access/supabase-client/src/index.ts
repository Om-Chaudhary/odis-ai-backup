/**
 * Supabase Client Library
 *
 * Provides Supabase client creation for different contexts:
 * - Browser client (RLS-enabled)
 * - Server client (RLS-enabled, cookie-based auth)
 * - Service client (bypasses RLS, admin operations)
 * - Proxy middleware (session refresh)
 */

// Export with specific names to avoid conflicts
export { createClient as createBrowserClient } from "./client";
export {
  createClient as createServerClient,
  createServiceClient,
} from "./server";
export * from "./browser";
export * from "./proxy";

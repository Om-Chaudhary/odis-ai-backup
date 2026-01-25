/**
 * Supabase Client Library
 *
 * Provides Supabase client creation for different contexts:
 * - Browser client (RLS-enabled)
 * - Clerk-authenticated clients (web app with Clerk auth)
 * - Proxy middleware (session refresh)
 *
 * For server-side imports:
 * - Server client: import from "@odis-ai/data-access/supabase-client/server"
 * - Service client: import from "@odis-ai/data-access/supabase-client/server"
 * - Clerk server client: import from "@odis-ai/data-access/supabase-client/clerk-server"
 */

// Client-side exports (safe for "use client" components and middleware)
export { createClient as createBrowserClient } from "./client";
export * from "./browser";
export { useClerkSupabaseClient, createPublicClient } from "./clerk-browser";
export * from "./proxy";

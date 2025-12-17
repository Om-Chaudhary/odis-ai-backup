/**
 * Browser-safe exports from @odis-ai/db
 * For use in Chrome extension and other browser contexts
 */

// Re-export browser client
export { createClient as createBrowserClient } from "./client";

// Re-export database types from @odis-ai/types
export type { Database } from "@odis-ai/types";

/**
 * Browser-safe exports from @odis-ai/db
 * For use in Chrome extension and other browser contexts
 */

// Re-export browser client
export { createBrowserClient } from "./client";

// Re-export database types
export type { Database } from "./database.types";

// Re-export TypeScript types (no runtime dependencies)
export type * from "./types";

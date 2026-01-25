/**
 * Database Library - Compatibility Re-exports
 *
 * This library now re-exports from split libraries:
 * - @odis-ai/data-access/supabase-client (client initialization)
 * - @odis-ai/data-access/repository-interfaces (interface contracts)
 * - @odis-ai/data-access/repository-impl (concrete implementations)
 * - @odis-ai/data-access/entities (domain entity helpers)
 *
 * Consumers should migrate to importing from specific libraries directly.
 *
 * For server-side imports, use:
 * - import { ... } from "@odis-ai/data-access/db/server"
 */

// Supabase clients (client-side only)
export * from "@odis-ai/data-access/supabase-client";

// Repository interfaces
export * from "@odis-ai/data-access/repository-interfaces";

// Repository implementations
export * from "@odis-ai/data-access/repository-impl";

// Entity helpers
export * from "@odis-ai/data-access/entities";

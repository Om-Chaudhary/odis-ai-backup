/**
 * @odis-ai/db
 *
 * Supabase database clients and repository layer.
 * Exports both RLS-respecting client and service (admin) client.
 */

// Supabase clients
export { createClient as createBrowserClient } from "./client";
export {
  createClient as createServerClient,
  createServiceClient,
} from "./server";
export * from "./middleware";

// Repositories
export * from "./repositories/base";
export * from "./repositories/types";
export * from "./repositories/call-repository";
export * from "./repositories/email-repository";
export * from "./repositories/user-repository";

// Entity helpers
export * from "./lib/entities";

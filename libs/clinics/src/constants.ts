/**
 * Supabase Error Code Constants
 *
 * Centralized error codes for consistent error handling across clinic utilities.
 */

/**
 * Supabase/PostgREST error codes
 */
export const SUPABASE_ERROR_CODES = {
  /**
   * No rows returned (not found) - this is expected for "maybeSingle()" queries
   * and should not be treated as an error
   */
  NOT_FOUND: "PGRST116",
  /**
   * Unique constraint violation (PostgreSQL error code)
   * Used to detect race conditions in getOrCreate operations
   */
  UNIQUE_VIOLATION: "23505",
} as const;

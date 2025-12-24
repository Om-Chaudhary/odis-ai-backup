import { getSupabaseClient } from "../supabase/client";
import type { Session } from "@supabase/supabase-js";

/**
 * Standardized error message for authentication failures
 */
const AUTH_ERROR_MESSAGE =
  "User is not signed in. Please sign in to the extension.";

/**
 * Get the current Supabase session without throwing an error
 * Returns null if no session exists
 *
 * @returns Promise<Session | null> The current session or null if not authenticated
 *
 * @example
 * ```typescript
 * const session = await getAuthSession();
 * if (session) {
 *   // User is authenticated
 * }
 * ```
 */
export const getAuthSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};

/**
 * Require an authenticated session, throwing an error if not authenticated
 * Use this when authentication is required for the operation
 *
 * @throws Error if user is not authenticated
 * @returns Promise<Session> The current authenticated session
 *
 * @example
 * ```typescript
 * try {
 *   const session = await requireAuthSession();
 *   // Use session.user.id, session.access_token, etc.
 * } catch (error) {
 *   // Handle authentication error
 * }
 * ```
 */
export const requireAuthSession = async (): Promise<Session> => {
  const session = await getAuthSession();

  if (!session?.user) {
    throw new Error(AUTH_ERROR_MESSAGE);
  }

  return session;
};

/**
 * Require an authenticated session and return the access token
 * Use this when you need the access token for API requests
 *
 * @throws Error if user is not authenticated or token is missing
 * @returns Promise<string> The access token
 *
 * @example
 * ```typescript
 * try {
 *   const token = await requireAuthToken();
 *   // Use token for API requests
 * } catch (error) {
 *   // Handle authentication error
 * }
 * ```
 */
export const requireAuthToken = async (): Promise<string> => {
  const session = await requireAuthSession();

  if (!session.access_token) {
    throw new Error("No access token found. Please sign in again.");
  }

  return session.access_token;
};

/**
 * Get the current user ID if authenticated, null otherwise
 * Convenience function for getting user ID without throwing
 *
 * @returns Promise<string | null> The user ID or null if not authenticated
 *
 * @example
 * ```typescript
 * const userId = await getUserId();
 * if (userId) {
 *   // User is authenticated, use userId
 * }
 * ```
 */
export const getUserId = async (): Promise<string | null> => {
  const session = await getAuthSession();
  return session?.user?.id ?? null;
};

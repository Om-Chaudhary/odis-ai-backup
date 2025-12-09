import type { SupabaseClient, AuthChangeEvent } from "@supabase/supabase-js";
import type { Session, User, AuthState } from "./types";

/**
 * Get the current session from the Supabase client
 */
export async function getSession(
  client: SupabaseClient,
): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await client.auth.getSession();

  if (error) {
    console.error("Error getting session:", error.message);
    return null;
  }

  return session;
}

/**
 * Get the current user from the Supabase client
 */
export async function getUser(client: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    console.error("Error getting user:", error.message);
    return null;
  }

  return user;
}

/**
 * Subscribe to auth state changes
 *
 * @param client - Supabase client
 * @param callback - Function called on auth state change
 * @returns Unsubscribe function
 *
 * @example
 * ```ts
 * const unsubscribe = onAuthStateChange(client, (event, session) => {
 *   if (event === "SIGNED_IN") {
 *     console.log("User signed in:", session?.user);
 *   } else if (event === "SIGNED_OUT") {
 *     console.log("User signed out");
 *   }
 * });
 *
 * // Clean up on unmount
 * return () => unsubscribe();
 * ```
 */
export function onAuthStateChange(
  client: SupabaseClient,
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
}

/**
 * Get the initial auth state (useful for initializing React state)
 */
export async function getInitialAuthState(
  client: SupabaseClient,
): Promise<AuthState> {
  try {
    const session = await getSession(client);
    const user = session?.user ?? null;

    return {
      user,
      session,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      isLoading: false,
      error: error as AuthState["error"],
    };
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(
  client: SupabaseClient,
): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await client.auth.refreshSession();

  if (error) {
    console.error("Error refreshing session:", error.message);
    return null;
  }

  return session;
}

/**
 * Sign out the current user
 */
export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();

  if (error) {
    console.error("Error signing out:", error.message);
    throw error;
  }
}

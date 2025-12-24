import { getSupabaseClient } from "./client";
import { useEffect, useState } from "react";
import type { AuthUser, AuthSession } from "./types";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

interface UseSupabaseAuthReturn {
  user: AuthUser;
  session: AuthSession;
  loading: boolean;
  error: Error | null;
}

/**
 * Fire-and-forget analytics session tracking
 * This function is intentionally non-blocking - it will not await the result
 */
function trackSessionStart(): void {
  // Fire and forget - don't await, don't block auth flow
  import("../analytics/event-tracker")
    .then(({ startSession }) => {
      startSession({
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        extension_version: chrome?.runtime?.getManifest?.()?.version,
      }).catch(() => {
        // Silently ignore - analytics should never break auth
      });
    })
    .catch(() => {
      // Silently ignore import errors
    });
}

/**
 * Fire-and-forget analytics session end tracking
 * This function is intentionally non-blocking
 */
function trackSessionEnd(): void {
  // Fire and forget - don't await, don't block auth flow
  import("../analytics/event-tracker")
    .then(({ endSession, getSessionId }) => {
      getSessionId()
        .then((sessionId) => {
          endSession(sessionId).catch(() => {
            // Silently ignore
          });
        })
        .catch(() => {
          // Silently ignore
        });
    })
    .catch(() => {
      // Silently ignore import errors
    });
}

/**
 * React hook for Supabase authentication state
 *
 * This hook automatically subscribes to auth state changes and
 * keeps the user and session in sync across all extension contexts
 *
 * IMPORTANT: Analytics tracking is done in a fire-and-forget manner
 * to prevent blocking the auth flow.
 *
 * @returns Authentication state object with user, session, loading, and error
 */
export const useSupabaseAuth = (): UseSupabaseAuthReturn => {
  const [user, setUser] = useState<AuthUser>(null);
  const [session, setSession] = useState<AuthSession>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initAuth = async () => {
      try {
        const supabase = getSupabaseClient();

        // Get initial session
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);

          // Start session tracking if user is already signed in (fire and forget)
          if (initialSession?.user) {
            trackSessionStart();
          }
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to initialize auth"),
          );
          setLoading(false);
        }
      }
    };

    void initAuth();

    // Subscribe to auth changes
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        // Auth state changed - session updated

        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);

          // Start session tracking when user signs in (fire and forget)
          if (event === "SIGNED_IN" && newSession?.user) {
            trackSessionStart();
          }

          // End session tracking when user signs out (fire and forget)
          if (event === "SIGNED_OUT") {
            trackSessionEnd();
          }
        }
      },
    );

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, loading, error };
};

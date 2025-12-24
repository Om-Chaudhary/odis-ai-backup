import { getSupabaseClient } from './client';
import { useSupabaseAuth } from './use-supabase-auth';
import { trackEvent, startSession, endSession } from '../analytics/event-tracker';
import { createContext, useContext, useCallback } from 'react';
import type { AuthContextValue } from './types';
import type React from 'react';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface SupabaseAuthProviderProps {
  children: React.ReactNode;
}

/**
 * Supabase Auth Provider Component
 *
 * Wrap your app with this provider to enable authentication functionality
 * across all components in your extension
 *
 * @example
 * ```tsx
 * import { SupabaseAuthProvider } from '@odis-ai/extension/shared';
 *
 * function App() {
 *   return (
 *     <SupabaseAuthProvider>
 *       <YourComponents />
 *     </SupabaseAuthProvider>
 *   );
 * }
 * ```
 */
export const SupabaseAuthProvider = ({ children }: SupabaseAuthProviderProps) => {
  const { user, session, loading, error } = useSupabaseAuth();

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Track failed sign in
      await trackEvent(
        {
          event_type: 'auth_sign_in',
          event_category: 'auth',
          event_action: 'sign_in',
          success: false,
          error_message: signInError.message,
          error_code: signInError.name,
        },
        { updateSession: false },
      );
      throw signInError;
    }

    // Track successful sign in
    await trackEvent(
      {
        event_type: 'auth_sign_in',
        event_category: 'auth',
        event_action: 'sign_in',
        success: true,
      },
      { updateSession: true },
    );

    // Start a new session
    await startSession();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      // Track failed sign up
      await trackEvent(
        {
          event_type: 'auth_sign_up',
          event_category: 'auth',
          event_action: 'sign_up',
          success: false,
          error_message: signUpError.message,
          error_code: signUpError.name,
        },
        { updateSession: false },
      );
      throw signUpError;
    }

    // Track successful sign up
    await trackEvent(
      {
        event_type: 'auth_sign_up',
        event_category: 'auth',
        event_action: 'sign_up',
        success: true,
      },
      { updateSession: true },
    );

    // Start a new session
    await startSession();
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();

    // End current session before signing out
    try {
      const { getSessionId } = await import('../analytics/event-tracker');
      const sessionId = await getSessionId();
      await endSession(sessionId);
    } catch {
      // Ignore session errors during sign out
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      // Track failed sign out
      await trackEvent(
        {
          event_type: 'auth_sign_out',
          event_category: 'auth',
          event_action: 'sign_out',
          success: false,
          error_message: signOutError.message,
          error_code: signOutError.name,
        },
        { updateSession: false },
      );
      throw signOutError;
    }

    // Track successful sign out
    await trackEvent(
      {
        event_type: 'auth_sign_out',
        event_category: 'auth',
        event_action: 'sign_out',
        success: true,
      },
      { updateSession: false },
    );
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context
 *
 * Must be used within a SupabaseAuthProvider
 *
 * @returns Authentication context value with user, session, and auth methods
 * @throws Error if used outside of SupabaseAuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *
 *   if (!user) {
 *     return <button onClick={() => signIn(email, password)}>Sign In</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.email}!</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }

  return context;
};

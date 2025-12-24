import type { Session, User, AuthError } from "@supabase/supabase-js";

/**
 * Storage adapter interface for cross-platform auth storage
 */
export interface AuthStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Configuration for creating an auth client
 */
export interface AuthClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage?: AuthStorageAdapter;
}

/**
 * Auth state for tracking user session
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  options?: {
    data?: Record<string, unknown>;
    emailRedirectTo?: string;
  };
}

/**
 * OAuth provider options
 */
export type OAuthProvider = "google" | "github" | "azure";

export interface OAuthSignInOptions {
  provider: OAuthProvider;
  redirectTo?: string;
  scopes?: string;
}

export type { Session, User, AuthError };

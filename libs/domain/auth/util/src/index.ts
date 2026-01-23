/**
 * @odis-ai/domain/auth
 *
 * Authentication utilities for the ODIS AI platform.
 *
 * Includes:
 * - Hybrid auth service (Clerk + Supabase Auth)
 * - Browser auth client for web/extension/Electron
 * - Session management utilities
 * - Storage adapters
 */

// Hybrid Auth (Clerk + Supabase)
export {
  detectAuthType,
  selectSupabaseClient,
  resolveUser,
  resolveClerkUser,
  resolveSupabaseUser,
  resolveUserWithLinking,
  resolveAuthContext,
  linkClerkAccount,
} from "./lib/hybrid-auth";

export type {
  AuthType,
  NormalizedUser,
  AuthContext,
  ClerkAuthObject,
  ResolveUserResult,
} from "./lib/hybrid-auth";

// Client
export { createBrowserAuthClient, createAuthStorage } from "./client";

// Session utilities
export {
  getSession,
  getUser,
  onAuthStateChange,
  getInitialAuthState,
  refreshSession,
  signOut,
} from "./session";

// Storage adapters
export {
  localStorageAdapter,
  createMemoryStorageAdapter,
  detectStorageAdapter,
} from "./storage";

// Types
export type {
  AuthStorageAdapter,
  AuthClientConfig,
  AuthState,
  SignInCredentials,
  SignUpCredentials,
  OAuthProvider,
  OAuthSignInOptions,
  Session,
  User,
  AuthError,
} from "./types";

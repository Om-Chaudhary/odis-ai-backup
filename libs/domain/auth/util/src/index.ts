/**
 * @odis-ai/auth
 *
 * Shared Supabase authentication client for browser-based platforms.
 * Works with web, Chrome extensions, and Electron renderer.
 */

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

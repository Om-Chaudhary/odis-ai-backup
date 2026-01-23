/**
 * Hybrid Authentication Service
 *
 * Consolidates authentication logic for the hybrid Clerk + Supabase Auth system.
 * - Clerk: Used for web users (Next.js dashboard)
 * - Supabase Auth: Used for iOS users
 *
 * This service provides unified functions for:
 * - Detecting auth type (Clerk vs Supabase)
 * - Selecting the appropriate Supabase client
 * - Resolving user information from either auth system
 * - Linking Clerk accounts to existing Supabase users
 */

import {
  createClient,
  createServiceClient,
} from "@odis-ai/data-access/db/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Authentication provider type */
export type AuthType = "clerk" | "supabase" | null;

/**
 * Normalized user shape that works across both auth systems.
 * Matches the Supabase User structure for backward compatibility.
 */
export interface NormalizedUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string | null;
  aud: string;
  role: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

/**
 * Complete authentication context returned by resolveAuthContext.
 */
export interface AuthContext {
  userId: string | null;
  user: NormalizedUser | null;
  isClerkAuth: boolean;
  orgId: string | null;
  orgRole: string | null;
}

/**
 * Clerk auth object shape (from @clerk/nextjs/server auth()).
 * Using a minimal interface to avoid importing Clerk types in the library.
 */
export interface ClerkAuthObject {
  userId: string | null;
  orgId?: string | null;
  orgRole?: string | null;
  sessionClaims?: {
    email?: string;
    [key: string]: unknown;
  } | null;
}

/**
 * Result from user resolution operations.
 */
export interface ResolveUserResult {
  user: NormalizedUser | null;
  linked?: boolean;
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Detects the authentication type based on Clerk auth state.
 *
 * @param clerkAuth - The Clerk auth object from `auth()` call
 * @returns 'clerk' if user is authenticated via Clerk, 'supabase' otherwise, null if no context
 *
 * @example
 * ```ts
 * const clerkAuth = await auth();
 * const authType = detectAuthType(clerkAuth);
 * // authType: 'clerk' | 'supabase' | null
 * ```
 */
export function detectAuthType(clerkAuth: ClerkAuthObject | null): AuthType {
  if (!clerkAuth) {
    return null;
  }
  return clerkAuth.userId ? "clerk" : "supabase";
}

/**
 * Selects the appropriate Supabase client based on authentication type.
 *
 * - Clerk users: Service client (bypasses RLS since they have no Supabase session)
 * - Supabase users: Regular client (RLS-enabled with user's session)
 *
 * @param isClerkAuth - Whether the user is authenticated via Clerk
 * @returns Supabase client appropriate for the auth type
 *
 * @example
 * ```ts
 * const clerkAuth = await auth();
 * const isClerkAuth = !!clerkAuth?.userId;
 * const supabase = await selectSupabaseClient(isClerkAuth);
 * ```
 */
export async function selectSupabaseClient(
  isClerkAuth: boolean,
): Promise<SupabaseClient<Database>> {
  if (isClerkAuth) {
    return createServiceClient();
  }
  return createClient();
}

/**
 * Resolves user information from Clerk authentication.
 * Queries the users table by clerk_user_id.
 *
 * @param clerkUserId - The Clerk user ID
 * @param supabase - Supabase client (should be service client for Clerk users)
 * @returns Normalized user or null if not found
 */
export async function resolveClerkUser(
  clerkUserId: string,
  supabase: SupabaseClient<Database>,
): Promise<NormalizedUser | null> {
  const { data: clerkUser, error } = await supabase
    .from("users")
    .select("id, email, created_at, updated_at")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !clerkUser) {
    return null;
  }

  return {
    id: clerkUser.id,
    email: clerkUser.email ?? "",
    created_at: clerkUser.created_at,
    updated_at: clerkUser.updated_at,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
  };
}

/**
 * Resolves user information from Supabase authentication.
 * Uses the Supabase auth.getUser() method.
 *
 * @param supabase - RLS-enabled Supabase client
 * @returns Normalized user or null if not authenticated
 */
export async function resolveSupabaseUser(
  supabase: SupabaseClient<Database>,
): Promise<NormalizedUser | null> {
  const {
    data: { user: supabaseUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[HybridAuth] Supabase auth error:", {
      code: authError.code,
      message: authError.message,
      status: authError.status,
    });
  }

  if (!supabaseUser) {
    return null;
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    created_at: supabaseUser.created_at ?? new Date().toISOString(),
    updated_at: supabaseUser.updated_at ?? null,
    aud: supabaseUser.aud ?? "authenticated",
    role: supabaseUser.role ?? "authenticated",
    app_metadata: supabaseUser.app_metadata ?? {},
    user_metadata: supabaseUser.user_metadata ?? {},
  };
}

/**
 * Unified user resolution that works with both auth systems.
 *
 * For Clerk users:
 * - Queries users table by clerk_user_id
 *
 * For Supabase Auth users:
 * - Calls supabase.auth.getUser()
 *
 * @param clerkAuth - Clerk auth object (may be null for Supabase-only auth)
 * @param supabase - Supabase client (service client for Clerk, regular for Supabase)
 * @returns Normalized user shape or null
 *
 * @example
 * ```ts
 * const clerkAuth = await auth();
 * const isClerkAuth = !!clerkAuth?.userId;
 * const supabase = await selectSupabaseClient(isClerkAuth);
 * const user = await resolveUser(clerkAuth, supabase);
 * ```
 */
export async function resolveUser(
  clerkAuth: ClerkAuthObject | null,
  supabase: SupabaseClient<Database>,
): Promise<NormalizedUser | null> {
  const isClerkAuth = !!clerkAuth?.userId;

  if (isClerkAuth && clerkAuth?.userId) {
    return resolveClerkUser(clerkAuth.userId, supabase);
  }

  return resolveSupabaseUser(supabase);
}

/**
 * Links a Clerk account to an existing Supabase user by email.
 *
 * This handles the race condition where a user signs in via Clerk
 * before the Clerk webhook has processed and created/linked their account.
 *
 * @param clerkUserId - The Clerk user ID to link
 * @param email - The email address to match against existing users
 * @param supabase - Service client (bypasses RLS)
 * @returns The linked user if found and linked, null otherwise
 *
 * @example
 * ```ts
 * const clerkAuth = await auth();
 * const email = clerkAuth.sessionClaims?.email;
 * if (email) {
 *   const linked = await linkClerkAccount(clerkAuth.userId, email, supabase);
 *   if (linked) {
 *     console.log('Account linked:', linked.id);
 *   }
 * }
 * ```
 */
export async function linkClerkAccount(
  clerkUserId: string,
  email: string,
  supabase: SupabaseClient<Database>,
): Promise<NormalizedUser | null> {
  // Find existing user by email
  const { data: emailUser, error: emailError } = await supabase
    .from("users")
    .select("id, email, created_at, updated_at")
    .eq("email", email)
    .single();

  if (emailError || !emailUser) {
    return null;
  }

  // Link the Clerk account to this user
  const { error: updateError } = await supabase
    .from("users")
    .update({
      clerk_user_id: clerkUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", emailUser.id);

  if (updateError) {
    console.error("[HybridAuth] Failed to link Clerk account:", {
      clerkUserId,
      email,
      error: updateError.message,
    });
    return null;
  }

  console.info("[HybridAuth] Linked Clerk account to existing user:", {
    clerkUserId,
    email,
    userId: emailUser.id,
  });

  return {
    id: emailUser.id,
    email: emailUser.email ?? "",
    created_at: emailUser.created_at,
    updated_at: new Date().toISOString(),
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
  };
}

/**
 * Resolves user with automatic Clerk account linking.
 *
 * This is the recommended function for user resolution as it handles:
 * 1. Standard Clerk user lookup by clerk_user_id
 * 2. Fallback to email-based lookup with automatic linking
 * 3. Standard Supabase Auth user resolution
 *
 * @param clerkAuth - Clerk auth object
 * @param supabase - Appropriate Supabase client for the auth type
 * @returns Object with user and whether linking occurred
 *
 * @example
 * ```ts
 * const clerkAuth = await auth();
 * const isClerkAuth = !!clerkAuth?.userId;
 * const supabase = await selectSupabaseClient(isClerkAuth);
 * const { user, linked } = await resolveUserWithLinking(clerkAuth, supabase);
 * ```
 */
export async function resolveUserWithLinking(
  clerkAuth: ClerkAuthObject | null,
  supabase: SupabaseClient<Database>,
): Promise<ResolveUserResult> {
  const isClerkAuth = !!clerkAuth?.userId;

  if (!isClerkAuth) {
    const user = await resolveSupabaseUser(supabase);
    return { user };
  }

  // Try standard Clerk lookup first
  const clerkUserId = clerkAuth!.userId!;
  const existingUser = await resolveClerkUser(clerkUserId, supabase);

  if (existingUser) {
    return { user: existingUser };
  }

  // Clerk user not found - try email-based linking
  const email = clerkAuth?.sessionClaims?.email;

  if (email) {
    const linkedUser = await linkClerkAccount(clerkUserId, email, supabase);
    if (linkedUser) {
      return { user: linkedUser, linked: true };
    }
  }

  // No user found and couldn't link - webhook will create them
  console.warn("[HybridAuth] Clerk user not found in Supabase:", {
    clerkUserId,
    hasEmail: !!email,
  });

  return { user: null };
}

/**
 * Resolves complete authentication context.
 *
 * This is the main entry point for hybrid authentication, providing:
 * - User information (normalized across both auth systems)
 * - Auth type detection
 * - Organization context (Clerk only)
 *
 * @param clerkAuth - Clerk auth object from auth() call
 * @param supabase - Supabase client (optional, will be created if not provided)
 * @returns Complete auth context
 *
 * @example
 * ```ts
 * const clerkAuth = await auth();
 * const ctx = await resolveAuthContext(clerkAuth);
 * // ctx.userId, ctx.user, ctx.isClerkAuth, ctx.orgId, ctx.orgRole
 * ```
 */
export async function resolveAuthContext(
  clerkAuth: ClerkAuthObject | null,
  supabase?: SupabaseClient<Database>,
): Promise<AuthContext> {
  const isClerkAuth = !!clerkAuth?.userId;

  // Select appropriate client if not provided
  const client = supabase ?? (await selectSupabaseClient(isClerkAuth));

  // Resolve user with automatic linking for Clerk users
  const { user } = await resolveUserWithLinking(clerkAuth, client);

  return {
    userId: user?.id ?? null,
    user,
    isClerkAuth,
    orgId: clerkAuth?.orgId ?? null,
    orgRole: clerkAuth?.orgRole ?? null,
  };
}

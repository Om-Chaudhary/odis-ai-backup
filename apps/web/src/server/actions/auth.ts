"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@odis-ai/data-access/db/server";
import type { User } from "@supabase/supabase-js";

/**
 * Get current authenticated user (hybrid Clerk + Supabase Auth support)
 *
 * Returns the current user from either:
 * - Clerk authentication (web users)
 * - Supabase Auth (iOS users)
 *
 * @returns User object or null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();

  // Try Clerk auth first (web users)
  const clerkAuth = await auth();

  if (clerkAuth?.userId) {
    // Clerk user - fetch from Supabase by clerk_user_id
    const { data: clerkUser, error } = await supabase
      .from("users")
      .select("id, email, created_at, updated_at")
      .eq("clerk_user_id", clerkAuth.userId)
      .single();

    if (error || !clerkUser) {
      // Clerk user not yet synced to Supabase (shouldn't happen if webhook works)
      console.warn("[getUser] Clerk user not found in Supabase:", {
        clerkUserId: clerkAuth.userId,
        error: error?.message,
      });
      return null;
    }

    // Map to Supabase User shape for backward compatibility
    return {
      id: clerkUser.id,
      email: clerkUser.email ?? "",
      created_at: clerkUser.created_at,
      updated_at: clerkUser.updated_at,
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
    } as User;
  }

  // Fallback to Supabase Auth (iOS users)
  const {
    data: { user: supabaseUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !supabaseUser) {
    return null;
  }

  // Ensure user exists in our custom users table
  const { error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", supabaseUser.id)
    .single();

  // If user doesn't exist in our users table, create them
  if (userError?.code === "PGRST116") {
    const { error: insertError } = await supabase.from("users").insert({
      id: supabaseUser.id,
      email: supabaseUser.email!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[getUser] Error creating user profile:", insertError);
      throw new Error(`Failed to create user profile: ${insertError.message}`);
    }
  }

  return supabaseUser;
}

/**
 * Get user profile by user ID
 * Works with both Clerk and Supabase user IDs
 */
export async function getUserProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(`id.eq.${userId},clerk_user_id.eq.${userId}`)
    .single();

  if (error) {
    console.error("[getUserProfile] Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Sign out (works with both auth systems)
 * Note: Clerk sign-out is handled by ClerkProvider automatically
 * This is primarily for Supabase Auth (iOS) users
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

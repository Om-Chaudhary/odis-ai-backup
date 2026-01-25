import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@odis-ai/shared/env";
import type { Database } from "@odis-ai/shared/types";

/**
 * Create a Supabase client for server-side use with Clerk authentication.
 *
 * This client uses Clerk's session token as the access token for Supabase,
 * which allows RLS policies to work based on the Clerk JWT claims.
 *
 * @returns Supabase client with Clerk JWT authentication
 */
export async function createClerkClient() {
  const { getToken } = await auth();

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      accessToken: async () => {
        // Get the Clerk session token
        // This token is automatically verified by Supabase when third-party auth is enabled
        const token = await getToken();
        return token ?? "";
      },
    },
  );
}

/**
 * Create a Supabase client with optional Clerk authentication.
 *
 * Falls back to an unauthenticated client if no Clerk session exists.
 * Useful for routes that may or may not have authentication.
 *
 * @returns Supabase client with optional Clerk JWT authentication
 */
export async function createOptionalClerkClient() {
  try {
    const { getToken, userId } = await auth();

    // If no user is signed in, return a basic client
    if (!userId) {
      return createSupabaseClient<Database>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );
    }

    return createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        accessToken: async () => {
          const token = await getToken();
          return token ?? "";
        },
      },
    );
  } catch {
    // If auth() fails (e.g., in a context without Clerk), return basic client
    return createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
}

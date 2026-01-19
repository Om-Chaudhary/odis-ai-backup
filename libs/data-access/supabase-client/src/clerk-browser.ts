"use client";

import { useSession } from "@clerk/nextjs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@odis-ai/shared/env";
import type { Database } from "@odis-ai/shared/types";
import { useMemo } from "react";

/**
 * React hook to create a Supabase client with Clerk authentication.
 *
 * This hook creates a memoized Supabase client that uses the Clerk session
 * token for authentication. The client is recreated when the session changes.
 *
 * @returns Supabase client with Clerk JWT authentication
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const supabase = useClerkSupabaseClient();
 *
 *   useEffect(() => {
 *     const fetchData = async () => {
 *       const { data } = await supabase.from('cases').select('*');
 *       // RLS policies are applied based on Clerk JWT claims
 *     };
 *     fetchData();
 *   }, [supabase]);
 * }
 * ```
 */
export function useClerkSupabaseClient() {
  const { session } = useSession();

  return useMemo(() => {
    return createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        accessToken: async () => {
          // Get the Clerk session token
          const token = await session?.getToken();
          return token ?? "";
        },
      },
    );
  }, [session]);
}

/**
 * Create a Supabase client for browser-side use without authentication.
 *
 * Use this for public data access or when authentication is not required.
 *
 * @returns Unauthenticated Supabase client
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Supabase client utilities for scripts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import { requireEnv } from "./env-loader";

/**
 * Creates a Supabase service client for scripts
 * Uses service role key to bypass RLS
 *
 * @example
 * const supabase = createScriptSupabaseClient();
 * const { data } = await supabase.from("cases").select("*");
 */
export function createScriptSupabaseClient(): SupabaseClient<Database> {
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

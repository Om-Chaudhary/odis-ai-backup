import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import { config } from "../config";

export function createSupabaseServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "pims-sync",
        },
      },
    },
  );
}

/**
 * Test Supabase connection with a simple query.
 * Useful for diagnosing connectivity issues after browser automation.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  latencyMs?: number;
}> {
  const start = Date.now();
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("clinics").select("id").limit(1);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

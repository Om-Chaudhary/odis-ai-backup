import {
  getSupabaseClient,
  requireAuthSession,
} from "@odis-ai/extension/shared";
import type { Database } from "@odis-ai/shared/types";

type DischargeSummary =
  Database["public"]["Tables"]["discharge_summaries"]["Row"];

/**
 * Fetch recent discharge summaries for the current authenticated user
 * Ordered by most recent first
 * Includes patient information for display
 */
const fetchRecentDischargeSummaries = async (
  limit = 5,
): Promise<DischargeSummary[]> => {
  const supabase = getSupabaseClient();

  // Ensure user is authenticated
  const session = await requireAuthSession();

  const { data, error } = await supabase
    .from("discharge_summaries")
    .select("*, cases!inner(id, external_id, patients(name))")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    // If none found, return empty list
    if (error.code === "PGRST116") return [];
    throw error;
  }

  return data ?? [];
};

/**
 * Fetch the most recent discharge summary for the current authenticated user
 * Returns null if no discharge summaries found
 */
const fetchLastDischargeSummary =
  async (): Promise<DischargeSummary | null> => {
    const summaries = await fetchRecentDischargeSummaries(1);
    return summaries.length > 0 ? summaries[0] : null;
  };

export type { DischargeSummary };
export { fetchRecentDischargeSummaries, fetchLastDischargeSummary };

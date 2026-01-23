/**
 * Clinic Slug Utilities
 *
 * Functions for generating and validating unique clinic slugs.
 */

import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { SUPABASE_ERROR_CODES } from "./constants";

type SupabaseClientType = SupabaseClient<Database>;

const logger = loggers.database.child("clinics");

/**
 * Ensure a clinic slug is unique by checking existing clinics and appending
 * a numeric suffix when needed. Uses a bounded number of attempts and falls
 * back to a timestamped suffix if collisions persist.
 */
export async function ensureUniqueClinicSlug(
  baseSlug: string,
  supabase: SupabaseClientType,
): Promise<string> {
  const maxAttempts = 5;
  let candidate = baseSlug;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data: existing, error } = await supabase
      .from("clinics")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
      logger.error("Error checking clinic slug availability", {
        baseSlug,
        candidateSlug: candidate,
        error: error.message,
        errorCode: error.code,
      });
      break;
    }

    if (!existing) {
      return candidate;
    }

    // Append incrementing suffix when a collision is found (e.g., slug-2, slug-3)
    candidate = `${baseSlug}-${attempt + 2}`;
  }

  // Fallback: use a timestamp-based suffix to avoid unbounded loops
  const fallbackSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
  logger.warn("Using fallback clinic slug after repeated collisions", {
    baseSlug,
    candidateSlug: fallbackSlug,
  });
  return fallbackSlug;
}

/**
 * Generate a URL-friendly slug from a clinic name
 */
export function generateSlugFromName(clinicName: string): string {
  return clinicName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

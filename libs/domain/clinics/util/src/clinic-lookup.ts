/**
 * Clinic Lookup Utilities
 *
 * Functions for finding clinic records by various identifiers.
 */

import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { SUPABASE_ERROR_CODES } from "./constants";

type SupabaseClientType = SupabaseClient<Database>;
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

const logger = loggers.database.child("clinics");

/**
 * Get clinic for authenticated user by matching clinic_name
 *
 * Uses the user's clinic_name field to find matching clinic record.
 * This supports the RLS pattern where users.clinic_name matches clinics.name.
 *
 * @param userId - Authenticated user ID (must be valid UUID)
 * @param supabase - Supabase client with user context
 * @returns Clinic record or null if:
 *   - User ID is invalid
 *   - User has no clinic_name set
 *   - User's clinic_name is empty
 *   - Clinic not found in clinics table
 *   - Clinic is inactive
 *   - Database error occurs (logged)
 *
 * @example
 * ```ts
 * const clinic = await getClinicByUserId(user.id, supabase);
 * if (clinic) {
 *   console.log(`User's clinic: ${clinic.name}`);
 * }
 * ```
 */
export async function getClinicByUserId(
  userId: string,
  supabase: SupabaseClientType,
): Promise<ClinicRow | null> {
  if (!userId || typeof userId !== "string") {
    logger.error("Invalid user ID provided", { userId });
    return null;
  }

  // Get user's clinic_name
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("clinic_name")
    .eq("id", userId)
    .single();

  if (userError || !user?.clinic_name) {
    logger.error("Failed to get user clinic_name", {
      userId,
      error: userError?.message,
      errorCode: userError?.code,
    });
    return null;
  }

  // Find clinic by name (case-insensitive, trimmed)
  const clinicName = user.clinic_name.trim();
  if (!clinicName) {
    logger.error("User has empty clinic_name", { userId });
    return null;
  }

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("*")
    .ilike("name", clinicName)
    .eq("is_active", true)
    .maybeSingle();

  if (clinicError && clinicError.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic", {
      clinicName,
      error: clinicError.message,
      errorCode: clinicError.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found", { clinicName, userId });
    return null;
  }

  return clinic;
}

/**
 * Get clinic by name (for backward compatibility)
 *
 * @param clinicName - Clinic name to search for (case-insensitive match)
 * @param supabase - Supabase client
 * @returns Clinic record or null if:
 *   - Clinic name is invalid or empty
 *   - Clinic not found
 *   - Clinic is inactive
 *   - Database error occurs (logged)
 *
 * @example
 * ```ts
 * const clinic = await getClinicByName("Alum Rock Animal Hospital", supabase);
 * if (clinic) {
 *   console.log(`Found clinic: ${clinic.id}`);
 * }
 * ```
 */
export async function getClinicByName(
  clinicName: string,
  supabase: SupabaseClientType,
): Promise<ClinicRow | null> {
  if (!clinicName?.trim()) {
    logger.error("Invalid clinic name provided", { clinicName });
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .ilike("name", clinicName.trim())
    .eq("is_active", true)
    .maybeSingle();

  if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic", {
      clinicName,
      error: error.message,
      errorCode: error.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found", { clinicName });
    return null;
  }

  return clinic;
}

/**
 * Get clinic by UUID
 *
 * Retrieves a clinic record by its unique identifier.
 * Useful when you have a clinic ID (e.g., from appointments table).
 *
 * @param clinicId - Clinic UUID (must be valid UUID format)
 * @param supabase - Supabase client
 * @returns Clinic record or null if:
 *   - Clinic ID is invalid (not a UUID format)
 *   - Clinic not found
 *   - Clinic is inactive
 *   - Database error occurs (logged)
 *
 * @example
 * ```ts
 * const clinic = await getClinicById(appointment.clinic_id, supabase);
 * if (clinic) {
 *   console.log(`Clinic: ${clinic.name}`);
 * }
 * ```
 */
export async function getClinicById(
  clinicId: string,
  supabase: SupabaseClientType,
): Promise<ClinicRow | null> {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!clinicId || typeof clinicId !== "string" || !uuidRegex.test(clinicId)) {
    logger.error("Invalid clinic ID format", { clinicId });
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .eq("is_active", true)
    .maybeSingle();

  if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic", {
      clinicId,
      error: error.message,
      errorCode: error.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found", { clinicId });
    return null;
  }

  return clinic;
}

/**
 * Get clinic by slug
 *
 * Retrieves a clinic record by its URL-friendly slug.
 * Used for clinic-scoped URL routing (e.g., /dashboard/[clinicSlug]/discharges).
 *
 * @param slug - Clinic slug (URL-friendly identifier)
 * @param supabase - Supabase client
 * @returns Clinic record or null if:
 *   - Slug is invalid or empty
 *   - Clinic not found
 *   - Clinic is inactive
 *   - Database error occurs (logged)
 *
 * @example
 * ```ts
 * const clinic = await getClinicBySlug("alum-rock-animal-hospital", supabase);
 * if (clinic) {
 *   console.log(`Clinic: ${clinic.name}`);
 * }
 * ```
 */
export async function getClinicBySlug(
  slug: string,
  supabase: SupabaseClientType,
): Promise<ClinicRow | null> {
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    logger.error("Invalid clinic slug provided", { slug });
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("slug", slug.toLowerCase().trim())
    .eq("is_active", true)
    .maybeSingle();

  if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic by slug", {
      slug,
      error: error.message,
      errorCode: error.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found by slug", { slug });
    return null;
  }

  return clinic;
}

/**
 * Get clinic ID from user ID (convenience wrapper)
 *
 * Quick access to clinic ID without fetching the full clinic object.
 * Useful when you only need the clinic UUID.
 *
 * @param userId - User ID
 * @param supabase - Supabase client with user context
 * @returns Clinic UUID or null if not found
 *
 * @example
 * ```ts
 * const clinicId = await getUserClinicId(user.id, supabase);
 * if (clinicId) {
 *   // Use clinicId for appointments, providers, etc.
 * }
 * ```
 */
export async function getUserClinicId(
  userId: string,
  supabase: SupabaseClientType,
): Promise<string | null> {
  const clinic = await getClinicByUserId(userId, supabase);
  return clinic?.id ?? null;
}

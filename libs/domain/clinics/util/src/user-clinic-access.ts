/**
 * User Clinic Access Utilities
 *
 * Functions for managing user access to clinics, including multi-clinic support.
 */

import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { getClinicByUserId } from "./clinic-lookup";

type SupabaseClientType = SupabaseClient<Database>;
type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

const logger = loggers.database.child("clinics");

/**
 * Get all user IDs belonging to a clinic
 *
 * Retrieves all users who have the same clinic_name as the given clinic.
 * Used for clinic-scoped data access where multiple users share the same clinic.
 *
 * @param clinicName - Clinic name to search for (case-insensitive match)
 * @param supabase - Supabase client
 * @returns Array of user IDs or empty array if:
 *   - Clinic name is invalid or empty
 *   - No users found with this clinic
 *   - Database error occurs (logged)
 *
 * @example
 * ```ts
 * const userIds = await getUserIdsByClinicName("Alum Rock Animal Hospital", supabase);
 * // Can be used to filter cases: .in("user_id", userIds)
 * ```
 */
export async function getUserIdsByClinicName(
  clinicName: string,
  supabase: SupabaseClientType,
): Promise<string[]> {
  if (!clinicName?.trim()) {
    logger.error("Invalid clinic name provided for user lookup", { clinicName });
    return [];
  }

  const { data: users, error } = await supabase
    .from("users")
    .select("id")
    .ilike("clinic_name", clinicName.trim());

  if (error) {
    logger.error("Error finding users by clinic name", {
      clinicName,
      error: error.message,
      errorCode: error.code,
    });
    return [];
  }

  return users?.map((u) => u.id) ?? [];
}

/**
 * Get all user IDs belonging to the same clinic as a given user
 *
 * Convenience wrapper that first gets the user's clinic, then finds all users in that clinic.
 *
 * @param userId - User ID to find clinic peers for
 * @param supabase - Supabase client
 * @returns Array of user IDs (including the given user) or just [userId] if no clinic found
 *
 * @example
 * ```ts
 * const clinicUserIds = await getClinicUserIds(ctx.user.id, supabase);
 * // Filter cases by clinic: .in("user_id", clinicUserIds)
 * ```
 */
export async function getClinicUserIds(
  userId: string,
  supabase: SupabaseClientType,
): Promise<string[]> {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("clinic_name")
    .eq("id", userId)
    .single();

  if (userError || !user?.clinic_name) {
    return [userId];
  }

  const userIds = await getUserIdsByClinicName(user.clinic_name, supabase);

  if (!userIds.includes(userId)) {
    userIds.push(userId);
  }

  return userIds;
}

/**
 * Get all clinics a user has access to
 *
 * Uses the user_clinic_access junction table for multi-clinic support.
 * Falls back to clinic_name lookup if no junction records exist.
 *
 * **Admin Access**: Users with role="admin" automatically have access to ALL clinics.
 *
 * @param userId - User ID
 * @param supabase - Supabase client
 * @returns Array of clinic records the user has access to
 */
export async function getUserClinics(
  userId: string,
  supabase: SupabaseClientType,
): Promise<ClinicRow[]> {
  if (!userId || typeof userId !== "string") {
    logger.error("Invalid user ID provided for getUserClinics", { userId });
    return [];
  }

  const { data: user } = await supabase
    .from("users")
    .select("role, clinic_name")
    .eq("id", userId)
    .single();

  // Admins get access to ALL clinics
  if (user?.role === "admin") {
    const { data: allClinics, error: allClinicsError } = await supabase
      .from("clinics")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!allClinicsError && allClinics) {
      logger.debug("Admin user - returning all clinics", {
        userId,
        clinicCount: allClinics.length,
      });
      return allClinics;
    }
  }

  // Non-admin users: try the junction table
  const { data: clinicAccess, error: accessError } = await supabase
    .from("user_clinic_access")
    .select(
      `
      clinic_id,
      is_primary,
      clinics (*)
    `,
    )
    .eq("user_id", userId);

  if (!accessError && clinicAccess && clinicAccess.length > 0) {
    const sorted = [...clinicAccess].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return 0;
    });

    return sorted
      .map((access) => access.clinics as ClinicRow)
      .filter((clinic): clinic is NonNullable<typeof clinic> => clinic !== null);
  }

  // Fallback to legacy clinic_name lookup
  const clinic = await getClinicByUserId(userId, supabase);
  return clinic ? [clinic] : [];
}

/**
 * Get user's primary clinic
 *
 * Returns the clinic marked as is_primary, or falls back to clinic_name.
 *
 * @param userId - User ID
 * @param supabase - Supabase client
 * @returns Primary clinic or null
 */
export async function getUserPrimaryClinic(
  userId: string,
  supabase: SupabaseClientType,
): Promise<ClinicRow | null> {
  if (!userId || typeof userId !== "string") {
    logger.error("Invalid user ID provided for getUserPrimaryClinic", { userId });
    return null;
  }

  const { data: primaryAccess } = await supabase
    .from("user_clinic_access")
    .select("clinics (*)")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (primaryAccess?.clinics) {
    return primaryAccess.clinics as ClinicRow;
  }

  return getClinicByUserId(userId, supabase);
}

/**
 * Check if user has access to a specific clinic
 *
 * Access is granted if:
 * - User has admin role (admins can access all clinics)
 * - User has explicit access via user_clinic_access junction table
 * - Clinic matches user's primary clinic_name field
 *
 * @param userId - User ID
 * @param clinicId - Clinic ID to check access for
 * @param supabase - Supabase client
 * @returns true if user has access
 */
export async function userHasClinicAccess(
  userId: string,
  clinicId: string,
  supabase: SupabaseClientType,
): Promise<boolean> {
  if (!userId || !clinicId) {
    return false;
  }

  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (user?.role === "admin") {
    return true;
  }

  const { data } = await supabase
    .from("user_clinic_access")
    .select("id")
    .eq("user_id", userId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (data) return true;

  const userClinic = await getClinicByUserId(userId, supabase);
  return userClinic?.id === clinicId;
}

/**
 * Get all user IDs with access to a clinic (including via junction table)
 *
 * Enhanced version of getClinicUserIds that also checks the junction table.
 *
 * @param clinicId - Clinic ID
 * @param supabase - Supabase client
 * @returns Array of user IDs with access to the clinic
 */
export async function getClinicUserIdsEnhanced(
  clinicId: string,
  supabase: SupabaseClientType,
): Promise<string[]> {
  const { data: junctionUsers } = await supabase
    .from("user_clinic_access")
    .select("user_id")
    .eq("clinic_id", clinicId);

  const { data: clinic } = await supabase
    .from("clinics")
    .select("name")
    .eq("id", clinicId)
    .maybeSingle();

  const junctionUserIds = junctionUsers?.map((u) => u.user_id) ?? [];

  if (clinic?.name) {
    const legacyUserIds = await getUserIdsByClinicName(clinic.name, supabase);
    return [...new Set([...junctionUserIds, ...legacyUserIds])];
  }

  return junctionUserIds;
}

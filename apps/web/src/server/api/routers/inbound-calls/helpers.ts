/**
 * Inbound Calls Helper Functions
 *
 * Shared utility functions used across inbound call procedures.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * User with clinic information
 */
export interface UserWithClinic {
  id: string;
  role: string | null;
  clinic_name: string | null;
}

/**
 * Get user with clinic information
 * Returns null if user not found (gracefully handles missing user records)
 */
export async function getUserWithClinic(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserWithClinic | null> {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, clinic_name")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Check if user has admin or practice owner role
 */
export function isAdminOrOwner(user: UserWithClinic | null): boolean {
  return user?.role === "admin" || user?.role === "practice_owner";
}

/**
 * Apply role-based filtering to query
 * Multi-clinic aware: filters by clinic_name for clinic-wide access
 */
export function applyRoleBasedFilter(
  query: ReturnType<SupabaseClient<unknown>["from"]>,
  user: UserWithClinic | null,
  clinicName: string | null,
): ReturnType<SupabaseClient<unknown>["from"]> {
  if (!user) {
    // No user data - filter to no results
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return query.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const hasAdminAccess = isAdminOrOwner(user);

  if (!hasAdminAccess) {
    // Regular users: see calls for their clinic OR calls assigned to them
    if (clinicName) {
      // Quote clinic name to handle spaces and special characters in PostgREST filter
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      query = query.or(`clinic_name.eq."${clinicName}",user_id.eq.${user.id}`);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      query = query.eq("user_id", user.id);
    }
  } else if (clinicName) {
    // Admins/practice owners see all calls for their clinic
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    query = query.eq("clinic_name", clinicName);
  }

  return query;
}

/**
 * Normalize phone number to last 10 digits
 */
export function normalizePhone(phone: string | null): string {
  return (phone ?? "").replace(/\D/g, "").slice(-10);
}

/**
 * Check if user has access to a call
 */
export function hasCallAccess(
  user: UserWithClinic | null,
  userClinicName: string | null,
  callClinicName: string | null,
  callUserId: string | null,
  currentUserId: string,
): boolean {
  if (isAdminOrOwner(user)) {
    return true;
  }

  if (userClinicName && callClinicName === userClinicName) {
    return true;
  }

  if (callUserId === currentUserId) {
    return true;
  }

  return false;
}

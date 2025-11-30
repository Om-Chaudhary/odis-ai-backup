/**
 * Clinic Lookup Utilities
 *
 * Helper functions for finding and creating clinic/provider records.
 * These utilities support the schedule sync functionality.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/database.types";

type SupabaseClientType = SupabaseClient<Database>;

/* ========================================
   Clinic Lookup
   ======================================== */

/**
 * Get clinic for authenticated user by matching clinic_name
 *
 * Uses the user's clinic_name field to find matching clinic record.
 * This supports the RLS pattern where users.clinic_name matches clinics.name.
 *
 * @param userId - Authenticated user ID
 * @param supabase - Supabase client with user context
 * @returns Clinic record or null if not found
 */
export async function getClinicByUserId(
  userId: string,
  supabase: SupabaseClientType,
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  // Get user's clinic_name
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("clinic_name")
    .eq("id", userId)
    .single();

  if (userError || !user?.clinic_name) {
    console.error("[getClinicByUserId] Failed to get user clinic_name", {
      userId,
      error: userError,
    });
    return null;
  }

  // Find clinic by name (case-insensitive, trimmed)
  const clinicName = user.clinic_name.trim();
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("*")
    .ilike("name", clinicName)
    .eq("is_active", true)
    .single();

  if (clinicError || !clinic) {
    console.error("[getClinicByUserId] Clinic not found", {
      clinicName,
      error: clinicError,
    });
    return null;
  }

  return clinic;
}

/**
 * Get clinic by name (for backward compatibility)
 *
 * @param clinicName - Clinic name to search for
 * @param supabase - Supabase client
 * @returns Clinic record or null if not found
 */
export async function getClinicByName(
  clinicName: string,
  supabase: SupabaseClientType,
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .ilike("name", clinicName.trim())
    .eq("is_active", true)
    .single();

  if (error || !clinic) {
    console.error("[getClinicByName] Clinic not found", {
      clinicName,
      error,
    });
    return null;
  }

  return clinic;
}

/* ========================================
   Provider Lookup/Creation
   ======================================== */

/**
 * Find or create provider record
 *
 * Looks up provider by neo_provider_id and clinic_id. If not found,
 * creates a new provider record.
 *
 * @param clinicId - Clinic UUID
 * @param neoProviderId - IDEXX Neo provider ID
 * @param providerName - Provider name
 * @param supabase - Supabase client
 * @param role - Provider role (default: "veterinarian")
 * @returns Provider UUID
 */
export async function getOrCreateProvider(
  clinicId: string,
  neoProviderId: string,
  providerName: string,
  supabase: SupabaseClientType,
  role = "veterinarian",
): Promise<string | null> {
  // First, try to find existing provider
  const { data: existingProvider, error: findError } = await supabase
    .from("providers")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("neo_provider_id", neoProviderId)
    .eq("is_active", true)
    .single();

  if (existingProvider) {
    return existingProvider.id;
  }

  // Provider not found - create new one
  const { data: newProvider, error: createError } = await supabase
    .from("providers")
    .insert({
      clinic_id: clinicId,
      neo_provider_id: neoProviderId,
      name: providerName,
      role: role,
      is_active: true,
    })
    .select("id")
    .single();

  if (createError || !newProvider) {
    console.error("[getOrCreateProvider] Failed to create provider", {
      clinicId,
      neoProviderId,
      providerName,
      error: createError,
    });
    return null;
  }

  console.log("[getOrCreateProvider] Created new provider", {
    providerId: newProvider.id,
    neoProviderId,
    providerName,
  });

  return newProvider.id;
}

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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!userId || typeof userId !== "string") {
    console.error("[getClinicByUserId] Invalid user ID provided", {
      userId,
    });
    return null;
  }

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
  if (!clinicName) {
    console.error("[getClinicByUserId] User has empty clinic_name", {
      userId,
    });
    return null;
  }

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("*")
    .ilike("name", clinicName)
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() to handle not found gracefully

  // Handle errors (excluding "not found" which is expected)
  if (clinicError && clinicError.code !== "PGRST116") {
    console.error("[getClinicByUserId] Error finding clinic", {
      clinicName,
      error: clinicError,
    });
    return null;
  }

  if (!clinic) {
    console.error("[getClinicByUserId] Clinic not found", {
      clinicName,
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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!clinicName?.trim()) {
    console.error("[getClinicByName] Invalid clinic name provided", {
      clinicName,
    });
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .ilike("name", clinicName.trim())
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() to handle not found gracefully

  // Handle errors (excluding "not found" which is expected)
  if (error && error.code !== "PGRST116") {
    console.error("[getClinicByName] Error finding clinic", {
      clinicName,
      error,
    });
    return null;
  }

  if (!clinic) {
    console.error("[getClinicByName] Clinic not found", {
      clinicName,
    });
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
 * @param clinicId - Clinic UUID
 * @param supabase - Supabase client
 * @returns Clinic record or null if not found
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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!clinicId || typeof clinicId !== "string") {
    console.error("[getClinicById] Invalid clinic ID provided", {
      clinicId,
    });
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("id", clinicId)
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() to handle not found gracefully

  // Handle errors (excluding "not found" which is expected)
  if (error && error.code !== "PGRST116") {
    console.error("[getClinicById] Error finding clinic", {
      clinicId,
      error,
    });
    return null;
  }

  if (!clinic) {
    console.error("[getClinicById] Clinic not found", {
      clinicId,
    });
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
/**
 * Valid provider roles
 */
const VALID_PROVIDER_ROLES = [
  "veterinarian",
  "vet_tech",
  "receptionist",
  "other",
] as const;

export async function getOrCreateProvider(
  clinicId: string,
  neoProviderId: string,
  providerName: string,
  supabase: SupabaseClientType,
  role = "veterinarian",
): Promise<string | null> {
  // Validate provider name
  if (!providerName || providerName.trim().length === 0) {
    console.error("[getOrCreateProvider] Invalid provider name", {
      clinicId,
      neoProviderId,
      providerName,
    });
    return null;
  }

  // Validate role
  const validRole = VALID_PROVIDER_ROLES.includes(
    role as (typeof VALID_PROVIDER_ROLES)[number],
  )
    ? (role as (typeof VALID_PROVIDER_ROLES)[number])
    : "veterinarian";

  // First, try to find existing provider
  const { data: existingProvider, error: findError } = await supabase
    .from("providers")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("neo_provider_id", neoProviderId)
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle not found gracefully

  if (findError && findError.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error for our use case)
    console.error("[getOrCreateProvider] Error finding provider", {
      clinicId,
      neoProviderId,
      error: findError,
    });
    return null;
  }

  if (existingProvider) {
    return existingProvider.id;
  }

  // Provider not found - create new one
  // Handle race condition: if two requests try to create simultaneously,
  // the second will fail due to unique constraint, so we retry the lookup
  const { data: newProvider, error: createError } = await supabase
    .from("providers")
    .insert({
      clinic_id: clinicId,
      neo_provider_id: neoProviderId,
      name: providerName.trim(),
      role: validRole,
      is_active: true,
    })
    .select("id")
    .single();

  // If creation failed, it might be a race condition - try to find again
  if (createError) {
    // Check if it's a unique constraint violation (race condition)
    const isUniqueViolation =
      createError.code === "23505" || // PostgreSQL unique violation
      createError.message.includes("duplicate") ||
      createError.message.includes("unique");

    if (isUniqueViolation) {
      // Race condition: provider was created by another request
      // Retry lookup
      const { data: retryProvider, error: retryError } = await supabase
        .from("providers")
        .select("id")
        .eq("clinic_id", clinicId)
        .eq("neo_provider_id", neoProviderId)
        .eq("is_active", true)
        .maybeSingle();

      if (retryError || !retryProvider) {
        console.error(
          "[getOrCreateProvider] Failed to find provider after race condition",
          {
            clinicId,
            neoProviderId,
            error: retryError,
          },
        );
        return null;
      }

      return retryProvider.id;
    }

    // Some other error occurred
    console.error("[getOrCreateProvider] Failed to create provider", {
      clinicId,
      neoProviderId,
      providerName,
      error: createError,
    });
    return null;
  }

  if (!newProvider) {
    console.error("[getOrCreateProvider] Provider creation returned no data", {
      clinicId,
      neoProviderId,
      providerName,
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

/* ========================================
   Clinic Creation
   ======================================== */

/**
 * Find or create clinic record
 *
 * Looks up clinic by name. If not found, creates a new clinic record.
 * Handles race conditions where multiple requests try to create the same clinic.
 *
 * @param clinicName - Clinic name (required)
 * @param supabase - Supabase client
 * @param clinicData - Optional additional clinic data (email, phone, address, pims_type)
 * @returns Clinic UUID or null if creation fails
 *
 * @example
 * ```ts
 * const clinicId = await getOrCreateClinic(
 *   "Alum Rock Animal Hospital",
 *   supabase,
 *   {
 *     email: "info@alumrockvet.com",
 *     phone: "+1-555-123-4567",
 *     pims_type: "idexx_neo"
 *   }
 * );
 * ```
 */
export async function getOrCreateClinic(
  clinicName: string,
  supabase: SupabaseClientType,
  clinicData?: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    pims_type?: string;
  },
): Promise<string | null> {
  // Validate clinic name
  if (!clinicName || clinicName.trim().length === 0) {
    console.error("[getOrCreateClinic] Invalid clinic name", {
      clinicName,
    });
    return null;
  }

  const trimmedName = clinicName.trim();

  // First, try to find existing clinic
  const { data: existingClinic, error: findError } = await supabase
    .from("clinics")
    .select("id")
    .ilike("name", trimmedName)
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle not found gracefully

  if (findError && findError.code !== "PGRST116") {
    // PGRST116 = no rows returned (not an error for our use case)
    console.error("[getOrCreateClinic] Error finding clinic", {
      clinicName: trimmedName,
      error: findError,
    });
    return null;
  }

  if (existingClinic) {
    return existingClinic.id;
  }

  // Clinic not found - create new one
  // Handle race condition: if two requests try to create simultaneously,
  // the second will fail due to unique constraint, so we retry the lookup
  const insertData: Database["public"]["Tables"]["clinics"]["Insert"] = {
    name: trimmedName,
    email: clinicData?.email ?? null,
    phone: clinicData?.phone ?? null,
    address: clinicData?.address ?? null,
    pims_type: clinicData?.pims_type ?? "idexx_neo",
    is_active: true,
  };

  const { data: newClinic, error: createError } = await supabase
    .from("clinics")
    .insert(insertData)
    .select("id")
    .single();

  // If creation failed, it might be a race condition - try to find again
  if (createError) {
    // Check if it's a unique constraint violation (race condition)
    const isUniqueViolation =
      createError.code === "23505" || // PostgreSQL unique violation
      createError.message.includes("duplicate") ||
      createError.message.includes("unique");

    if (isUniqueViolation) {
      // Race condition: clinic was created by another request
      // Retry lookup
      const { data: retryClinic, error: retryError } = await supabase
        .from("clinics")
        .select("id")
        .ilike("name", trimmedName)
        .eq("is_active", true)
        .maybeSingle();

      if (retryError || !retryClinic) {
        console.error(
          "[getOrCreateClinic] Failed to find clinic after race condition",
          {
            clinicName: trimmedName,
            error: retryError,
          },
        );
        return null;
      }

      return retryClinic.id;
    }

    // Some other error occurred
    console.error("[getOrCreateClinic] Failed to create clinic", {
      clinicName: trimmedName,
      error: createError,
    });
    return null;
  }

  if (!newClinic) {
    console.error("[getOrCreateClinic] Clinic creation returned no data", {
      clinicName: trimmedName,
    });
    return null;
  }

  console.log("[getOrCreateClinic] Created new clinic", {
    clinicId: newClinic.id,
    clinicName: trimmedName,
  });

  return newClinic.id;
}

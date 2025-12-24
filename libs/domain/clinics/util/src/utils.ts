/**
 * Clinic Lookup Utilities
 *
 * Helper functions for finding and creating clinic/provider records.
 * These utilities support the schedule sync functionality.
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
async function ensureUniqueClinicSlug(
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

/* ========================================
   Clinic Lookup
   ======================================== */

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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!userId || typeof userId !== "string") {
    logger.error("Invalid user ID provided", {
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
    logger.error("User has empty clinic_name", {
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
  if (clinicError && clinicError.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic", {
      clinicName,
      error: clinicError.message,
      errorCode: clinicError.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found", {
      clinicName,
      userId,
    });
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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!clinicName?.trim()) {
    logger.error("Invalid clinic name provided", {
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
  if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic", {
      clinicName,
      error: error.message,
      errorCode: error.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found", {
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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!clinicId || typeof clinicId !== "string" || !uuidRegex.test(clinicId)) {
    logger.error("Invalid clinic ID format", {
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
  if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic", {
      clinicId,
      error: error.message,
      errorCode: error.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found", {
      clinicId,
    });
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
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!slug || typeof slug !== "string" || slug.trim().length === 0) {
    logger.error("Invalid clinic slug provided", {
      slug,
    });
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("slug", slug.toLowerCase().trim())
    .eq("is_active", true)
    .maybeSingle();

  // Handle errors (excluding "not found" which is expected)
  if (error && error.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    logger.error("Error finding clinic by slug", {
      slug,
      error: error.message,
      errorCode: error.code,
    });
    return null;
  }

  if (!clinic) {
    logger.debug("Clinic not found by slug", {
      slug,
    });
    return null;
  }

  return clinic;
}

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
    logger.error("Invalid clinic name provided for user lookup", {
      clinicName,
    });
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
  // Get user's clinic
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("clinic_name")
    .eq("id", userId)
    .single();

  if (userError || !user?.clinic_name) {
    // If no clinic found, return just the user's own ID
    return [userId];
  }

  // Get all users in the same clinic
  const userIds = await getUserIdsByClinicName(user.clinic_name, supabase);

  // Ensure the original user is included (in case of any edge case)
  if (!userIds.includes(userId)) {
    userIds.push(userId);
  }

  return userIds;
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
    logger.error("Invalid provider name", {
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

  if (findError && findError.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    // NOT_FOUND = no rows returned (not an error for our use case)
    logger.error("Error finding provider", {
      clinicId,
      neoProviderId,
      error: findError.message,
      errorCode: findError.code,
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
      createError.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION ||
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
        logger.error("Failed to find provider after race condition", {
          clinicId,
          neoProviderId,
          error: retryError?.message,
          errorCode: retryError?.code,
        });
        return null;
      }

      return retryProvider.id;
    }

    // Some other error occurred
    logger.error("Failed to create provider", {
      clinicId,
      neoProviderId,
      providerName,
      error: createError.message,
      errorCode: createError.code,
    });
    return null;
  }

  if (!newProvider) {
    logger.error("Provider creation returned no data", {
      clinicId,
      neoProviderId,
      providerName,
    });
    return null;
  }

  logger.info("Created new provider", {
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
 * @param clinicName - Clinic name (required, must not be empty)
 * @param supabase - Supabase client
 * @param clinicData - Optional additional clinic data (email, phone, address, pims_type)
 *   - email: Must be valid email format if provided
 *   - phone: Must be 10-15 digits if provided
 * @returns Clinic UUID or null if:
 *   - Clinic name is invalid or empty
 *   - Email format is invalid (if provided)
 *   - Phone format is invalid (if provided)
 *   - Clinic creation fails (logged)
 *   - Database error occurs (logged)
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
    logger.error("Invalid clinic name", {
      clinicName,
    });
    return null;
  }

  // Validate email format if provided
  if (clinicData?.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clinicData.email)) {
      logger.error("Invalid email format", {
        email: clinicData.email,
        clinicName,
      });
      return null;
    }
  }

  // Validate phone format if provided (basic E.164 or common formats)
  if (clinicData?.phone) {
    const phoneDigits = clinicData.phone.replace(/\D/g, "");
    // Basic validation: should have 10-15 digits (E.164 allows up to 15)
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      logger.error("Invalid phone format", {
        phone: clinicData.phone,
        clinicName,
      });
      return null;
    }
  }

  const trimmedName = clinicName.trim();

  // First, try to find existing clinic
  const { data: existingClinic, error: findError } = await supabase
    .from("clinics")
    .select("id")
    .ilike("name", trimmedName)
    .eq("is_active", true)
    .maybeSingle(); // Use maybeSingle() instead of single() to handle not found gracefully

  if (findError && findError.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
    // NOT_FOUND = no rows returned (not an error for our use case)
    logger.error("Error finding clinic", {
      clinicName: trimmedName,
      error: findError.message,
      errorCode: findError.code,
    });
    return null;
  }

  if (existingClinic) {
    return existingClinic.id;
  }

  // Clinic not found - create new one
  // Handle race condition: if two requests try to create simultaneously,
  // the second will fail due to unique constraint, so we retry the lookup
  // Generate slug from clinic name (lowercase, replace non-alphanumeric with hyphens)
  const baseSlug = trimmedName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
  const slug = await ensureUniqueClinicSlug(baseSlug, supabase);

  const insertData: Database["public"]["Tables"]["clinics"]["Insert"] = {
    name: trimmedName,
    slug,
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
      createError.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION ||
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
        logger.error("Failed to find clinic after race condition", {
          clinicName: trimmedName,
          error: retryError?.message,
          errorCode: retryError?.code,
        });
        return null;
      }

      return retryClinic.id;
    }

    // Some other error occurred
    logger.error("Failed to create clinic", {
      clinicName: trimmedName,
      error: createError.message,
      errorCode: createError.code,
    });
    return null;
  }

  if (!newClinic) {
    logger.error("Clinic creation returned no data", {
      clinicName: trimmedName,
    });
    return null;
  }

  logger.info("Created new clinic", {
    clinicId: newClinic.id,
    clinicName: trimmedName,
  });

  return newClinic.id;
}

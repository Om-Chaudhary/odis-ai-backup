/**
 * Clinic Creation Utilities
 *
 * Functions for creating clinic and provider records with race condition handling.
 */

import type { Database } from "@odis-ai/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggers } from "@odis-ai/shared/logger";
import { SUPABASE_ERROR_CODES } from "./constants";
import { ensureUniqueClinicSlug, generateSlugFromName } from "./clinic-slug";

type SupabaseClientType = SupabaseClient<Database>;

const logger = loggers.database.child("clinics");

/**
 * Valid provider roles
 */
const VALID_PROVIDER_ROLES = [
  "veterinarian",
  "vet_tech",
  "receptionist",
  "other",
] as const;

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
  if (!clinicName || clinicName.trim().length === 0) {
    logger.error("Invalid clinic name", { clinicName });
    return null;
  }

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

  if (clinicData?.phone) {
    const phoneDigits = clinicData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      logger.error("Invalid phone format", {
        phone: clinicData.phone,
        clinicName,
      });
      return null;
    }
  }

  const trimmedName = clinicName.trim();

  const { data: existingClinic, error: findError } = await supabase
    .from("clinics")
    .select("id")
    .ilike("name", trimmedName)
    .eq("is_active", true)
    .maybeSingle();

  if (findError && findError.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
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

  const baseSlug = generateSlugFromName(trimmedName);
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

  if (createError) {
    const isUniqueViolation =
      createError.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION ||
      createError.message.includes("duplicate") ||
      createError.message.includes("unique");

    if (isUniqueViolation) {
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

    logger.error("Failed to create clinic", {
      clinicName: trimmedName,
      error: createError.message,
      errorCode: createError.code,
    });
    return null;
  }

  if (!newClinic) {
    logger.error("Clinic creation returned no data", { clinicName: trimmedName });
    return null;
  }

  logger.info("Created new clinic", {
    clinicId: newClinic.id,
    clinicName: trimmedName,
  });

  return newClinic.id;
}

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
  if (!providerName || providerName.trim().length === 0) {
    logger.error("Invalid provider name", {
      clinicId,
      neoProviderId,
      providerName,
    });
    return null;
  }

  const validRole = VALID_PROVIDER_ROLES.includes(
    role as (typeof VALID_PROVIDER_ROLES)[number],
  )
    ? (role as (typeof VALID_PROVIDER_ROLES)[number])
    : "veterinarian";

  const { data: existingProvider, error: findError } = await supabase
    .from("providers")
    .select("id")
    .eq("clinic_id", clinicId)
    .eq("neo_provider_id", neoProviderId)
    .eq("is_active", true)
    .maybeSingle();

  if (findError && findError.code !== SUPABASE_ERROR_CODES.NOT_FOUND) {
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

  if (createError) {
    const isUniqueViolation =
      createError.code === SUPABASE_ERROR_CODES.UNIQUE_VIOLATION ||
      createError.message.includes("duplicate") ||
      createError.message.includes("unique");

    if (isUniqueViolation) {
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

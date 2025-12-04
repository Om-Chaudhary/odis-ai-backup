/**
 * Clinic VAPI Configuration Utilities
 *
 * Helper functions for fetching clinic-specific VAPI assistant IDs
 * and phone number configurations. Falls back to environment variables
 * when clinic-specific configuration is not available.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/database.types";
import { env } from "~/env";
import { loggers } from "~/lib/logger";
import { getClinicByName, getClinicByUserId } from "./utils";

type SupabaseClientType = SupabaseClient<Database>;

const logger = loggers.vapi.child("clinic-config");

/**
 * VAPI configuration for a clinic
 */
export interface ClinicVapiConfig {
  /** VAPI assistant ID for outbound calls (discharge follow-ups) */
  outboundAssistantId: string | null;
  /** VAPI assistant ID for inbound calls */
  inboundAssistantId: string | null;
  /** VAPI phone number ID for outbound caller ID */
  phoneNumberId: string | null;
  /** Clinic name (for logging/debugging) */
  clinicName: string | null;
  /** Whether this config came from clinic-specific settings or env fallback */
  source: "clinic" | "env_fallback";
}

/**
 * Get VAPI configuration for a clinic by name
 *
 * Fetches clinic-specific VAPI assistant IDs and phone number ID.
 * Falls back to environment variables if clinic config is not set.
 *
 * @param clinicName - Clinic name to look up
 * @param supabase - Supabase client
 * @returns VAPI configuration with assistant IDs and phone number ID
 *
 * @example
 * ```ts
 * const config = await getClinicVapiConfig("Alum Rock Animal Hospital", supabase);
 * if (config.outboundAssistantId) {
 *   // Use clinic-specific assistant for outbound calls
 * }
 * ```
 */
export async function getClinicVapiConfig(
  clinicName: string,
  supabase: SupabaseClientType,
): Promise<ClinicVapiConfig> {
  const envFallback: ClinicVapiConfig = {
    outboundAssistantId: env.VAPI_ASSISTANT_ID ?? null,
    inboundAssistantId: env.VAPI_ASSISTANT_ID ?? null,
    phoneNumberId: env.VAPI_PHONE_NUMBER_ID ?? null,
    clinicName: null,
    source: "env_fallback",
  };

  if (!clinicName?.trim()) {
    logger.debug("No clinic name provided, using env fallback");
    return envFallback;
  }

  const clinic = await getClinicByName(clinicName, supabase);

  if (!clinic) {
    logger.debug("Clinic not found, using env fallback", { clinicName });
    return envFallback;
  }

  // Check if clinic has any VAPI config set
  const hasClinicConfig =
    clinic.outbound_assistant_id != null ||
    clinic.inbound_assistant_id != null ||
    clinic.phone_number_id != null;

  if (!hasClinicConfig) {
    logger.debug("Clinic has no VAPI config, using env fallback", {
      clinicName: clinic.name,
    });
    return {
      ...envFallback,
      clinicName: clinic.name,
    };
  }

  logger.debug("Using clinic-specific VAPI config", {
    clinicName: clinic.name,
    hasOutbound: !!clinic.outbound_assistant_id,
    hasInbound: !!clinic.inbound_assistant_id,
    hasPhoneNumber: !!clinic.phone_number_id,
  });

  return {
    outboundAssistantId:
      clinic.outbound_assistant_id ?? env.VAPI_ASSISTANT_ID ?? null,
    inboundAssistantId:
      clinic.inbound_assistant_id ?? env.VAPI_ASSISTANT_ID ?? null,
    phoneNumberId: clinic.phone_number_id ?? env.VAPI_PHONE_NUMBER_ID ?? null,
    clinicName: clinic.name,
    source: "clinic",
  };
}

/**
 * Get VAPI configuration for a user's clinic
 *
 * Looks up the user's clinic_name and fetches VAPI configuration.
 * Falls back to environment variables if user has no clinic or clinic has no config.
 *
 * @param userId - User ID to look up clinic for
 * @param supabase - Supabase client
 * @returns VAPI configuration with assistant IDs and phone number ID
 *
 * @example
 * ```ts
 * const config = await getClinicVapiConfigByUserId(user.id, supabase);
 * // Use config.outboundAssistantId for scheduling discharge calls
 * ```
 */
export async function getClinicVapiConfigByUserId(
  userId: string,
  supabase: SupabaseClientType,
): Promise<ClinicVapiConfig> {
  const envFallback: ClinicVapiConfig = {
    outboundAssistantId: env.VAPI_ASSISTANT_ID ?? null,
    inboundAssistantId: env.VAPI_ASSISTANT_ID ?? null,
    phoneNumberId: env.VAPI_PHONE_NUMBER_ID ?? null,
    clinicName: null,
    source: "env_fallback",
  };

  if (!userId) {
    logger.debug("No user ID provided, using env fallback");
    return envFallback;
  }

  const clinic = await getClinicByUserId(userId, supabase);

  if (!clinic) {
    logger.debug("User has no clinic, using env fallback", { userId });
    return envFallback;
  }

  // Check if clinic has any VAPI config set
  const hasClinicConfig =
    clinic.outbound_assistant_id != null ||
    clinic.inbound_assistant_id != null ||
    clinic.phone_number_id != null;

  if (!hasClinicConfig) {
    logger.debug("User's clinic has no VAPI config, using env fallback", {
      userId,
      clinicName: clinic.name,
    });
    return {
      ...envFallback,
      clinicName: clinic.name,
    };
  }

  logger.debug("Using user's clinic-specific VAPI config", {
    userId,
    clinicName: clinic.name,
    hasOutbound: !!clinic.outbound_assistant_id,
    hasInbound: !!clinic.inbound_assistant_id,
    hasPhoneNumber: !!clinic.phone_number_id,
  });

  return {
    outboundAssistantId:
      clinic.outbound_assistant_id ?? env.VAPI_ASSISTANT_ID ?? null,
    inboundAssistantId:
      clinic.inbound_assistant_id ?? env.VAPI_ASSISTANT_ID ?? null,
    phoneNumberId: clinic.phone_number_id ?? env.VAPI_PHONE_NUMBER_ID ?? null,
    clinicName: clinic.name,
    source: "clinic",
  };
}

/**
 * Get clinic by inbound assistant ID
 *
 * Looks up which clinic uses a specific VAPI assistant ID for inbound calls.
 * Useful for routing inbound calls to the correct clinic.
 *
 * @param assistantId - VAPI assistant ID from inbound call
 * @param supabase - Supabase client
 * @returns Clinic record or null if not found
 *
 * @example
 * ```ts
 * const clinic = await getClinicByInboundAssistantId(call.assistantId, supabase);
 * if (clinic) {
 *   // Route call to this clinic's users
 * }
 * ```
 */
export async function getClinicByInboundAssistantId(
  assistantId: string,
  supabase: SupabaseClientType,
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!assistantId?.trim()) {
    logger.debug("No assistant ID provided");
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("inbound_assistant_id", assistantId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    logger.error("Error looking up clinic by inbound assistant ID", {
      assistantId,
      error: error.message,
    });
    return null;
  }

  if (clinic) {
    logger.debug("Found clinic by inbound assistant ID", {
      assistantId,
      clinicName: clinic.name,
    });
  }

  return clinic;
}

/**
 * Get clinic by outbound assistant ID
 *
 * Looks up which clinic uses a specific VAPI assistant ID for outbound calls.
 *
 * @param assistantId - VAPI assistant ID from outbound call
 * @param supabase - Supabase client
 * @returns Clinic record or null if not found
 */
export async function getClinicByOutboundAssistantId(
  assistantId: string,
  supabase: SupabaseClientType,
): Promise<Database["public"]["Tables"]["clinics"]["Row"] | null> {
  if (!assistantId?.trim()) {
    logger.debug("No assistant ID provided");
    return null;
  }

  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("*")
    .eq("outbound_assistant_id", assistantId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    logger.error("Error looking up clinic by outbound assistant ID", {
      assistantId,
      error: error.message,
    });
    return null;
  }

  if (clinic) {
    logger.debug("Found clinic by outbound assistant ID", {
      assistantId,
      clinicName: clinic.name,
    });
  }

  return clinic;
}

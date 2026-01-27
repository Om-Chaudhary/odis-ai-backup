/**
 * Clinic Lookup by VAPI Assistant ID
 *
 * Resolves a VAPI assistant ID to its associated clinic.
 * Supports both squad-based assistants (via vapi_assistant_mappings)
 * and legacy single assistants (via clinics.inbound_assistant_id).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import { loggers } from "@odis-ai/shared/logger";

const logger = loggers.api.child("find-clinic-by-assistant");

/**
 * Clinic lookup result
 */
export interface ClinicLookupResult {
  id: string;
  name: string;
}

/**
 * Extended clinic lookup result with additional config
 */
export interface ClinicWithConfig extends ClinicLookupResult {
  /** Clinic timezone (e.g., "America/Los_Angeles") */
  timezone?: string | null;
  /** PIMS type (e.g., "idexx", "avimark", etc.) */
  pims_type?: string | null;
  er_config?: {
    name: string;
    address: string;
    phone: string;
    is_24hr: boolean;
  } | null;
  business_hours?: Record<string, unknown> | null;
  address_config?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  } | null;
}

/**
 * Look up clinic by VAPI assistant ID
 *
 * Uses a two-tier lookup strategy:
 * 1. First checks `vapi_assistant_mappings` table (supports squads, dev/prod separation)
 * 2. Falls back to `clinics.inbound_assistant_id` (legacy single assistant support)
 *
 * @param supabase - The Supabase client (should be service client for webhook paths)
 * @param assistantId - The VAPI assistant ID from the call
 * @returns The clinic or null if not found
 *
 * @example
 * ```ts
 * const supabase = await createServiceClient();
 * const clinic = await findClinicByAssistantId(supabase, assistantId);
 *
 * if (!clinic) {
 *   return buildErrorResponse(request, "Clinic not found", "...", toolCallId, 404);
 * }
 * ```
 */
export async function findClinicByAssistantId(
  supabase: SupabaseClient<Database>,
  assistantId: string,
): Promise<ClinicLookupResult | null> {
  // First, try the new mappings table (supports squads, dev/prod separation)
  const { data: mapping, error: mappingError } = await supabase
    .from("vapi_assistant_mappings")
    .select("clinic_id, assistant_name, environment")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .single();

  if (mapping && !mappingError) {
    // Found in mappings - get clinic details
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name")
      .eq("id", mapping.clinic_id)
      .single();

    if (clinic && !clinicError) {
      logger.info("Clinic found via assistant mapping", {
        assistantId,
        assistantName: mapping.assistant_name,
        environment: mapping.environment,
        clinicId: clinic.id,
        clinicName: clinic.name,
      });
      return clinic;
    }
  }

  // Fallback: check legacy inbound_assistant_id column
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, name")
    .eq("inbound_assistant_id", assistantId)
    .single();

  if (error || !clinic) {
    logger.warn("Clinic not found for assistant_id", { assistantId, error });
    return null;
  }

  logger.info("Clinic found via legacy inbound_assistant_id", {
    assistantId,
    clinicId: clinic.id,
    clinicName: clinic.name,
  });

  return clinic;
}

/**
 * Look up clinic by VAPI assistant ID with additional config columns
 *
 * Same as findClinicByAssistantId but includes er_config, business_hours, and address_config.
 *
 * @param supabase - The Supabase client
 * @param assistantId - The VAPI assistant ID
 * @returns The clinic with config or null if not found
 */
export async function findClinicWithConfigByAssistantId(
  supabase: SupabaseClient<Database>,
  assistantId: string,
): Promise<ClinicWithConfig | null> {
  // First, try the new mappings table
  const { data: mapping, error: mappingError } = await supabase
    .from("vapi_assistant_mappings")
    .select("clinic_id, assistant_name, environment")
    .eq("assistant_id", assistantId)
    .eq("is_active", true)
    .single();

  if (mapping && !mappingError) {
    // Found in mappings - get clinic details with config
    const { data: clinic, error: clinicError } = await supabase
      .from("clinics")
      .select("id, name, timezone, pims_type, er_config, business_hours, address_config")
      .eq("id", mapping.clinic_id)
      .single();

    if (clinic && !clinicError) {
      logger.info("Clinic with config found via assistant mapping", {
        assistantId,
        assistantName: mapping.assistant_name,
        clinicId: clinic.id,
      });
      return clinic as ClinicWithConfig;
    }
  }

  // Fallback: check legacy inbound_assistant_id column
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, name, timezone, pims_type, er_config, business_hours, address_config")
    .eq("inbound_assistant_id", assistantId)
    .single();

  if (error || !clinic) {
    logger.warn("Clinic with config not found for assistant_id", {
      assistantId,
      error,
    });
    return null;
  }

  return clinic as ClinicWithConfig;
}

/**
 * Look up clinic directly by clinic_id
 *
 * Used when clinic_id is passed directly (for dev/testing purposes).
 *
 * @param supabase - The Supabase client
 * @param clinicId - The clinic UUID
 * @returns The clinic or null if not found
 */
export async function findClinicById(
  supabase: SupabaseClient<Database>,
  clinicId: string,
): Promise<ClinicLookupResult | null> {
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, name")
    .eq("id", clinicId)
    .single();

  if (error || !clinic) {
    logger.warn("Clinic not found by id", { clinicId, error });
    return null;
  }

  return clinic;
}

/**
 * Look up clinic directly by clinic_id with config
 *
 * @param supabase - The Supabase client
 * @param clinicId - The clinic UUID
 * @returns The clinic with config or null if not found
 */
export async function findClinicWithConfigById(
  supabase: SupabaseClient<Database>,
  clinicId: string,
): Promise<ClinicWithConfig | null> {
  const { data: clinic, error } = await supabase
    .from("clinics")
    .select("id, name, timezone, pims_type, er_config, business_hours, address_config")
    .eq("id", clinicId)
    .single();

  if (error || !clinic) {
    logger.warn("Clinic with config not found by id", { clinicId, error });
    return null;
  }

  return clinic as ClinicWithConfig;
}

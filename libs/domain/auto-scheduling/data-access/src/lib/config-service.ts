/**
 * Auto-Scheduling Config Service
 *
 * CRUD operations for auto-scheduling configuration per clinic.
 */

import type { SupabaseClientType } from "@odis-ai/shared/types/supabase";
import type { Json } from "@odis-ai/shared/types";
import type {
  AutoSchedulingConfig,
  AutoSchedulingConfigInput,
  AutoSchedulingConfigRow,
  SchedulingCriteria,
} from "../types";

/**
 * Transform database row to config object
 */
function transformConfig(row: AutoSchedulingConfigRow): AutoSchedulingConfig {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    isEnabled: row.is_enabled ?? false,
    autoEmailEnabled: row.auto_email_enabled ?? true,
    autoCallEnabled: row.auto_call_enabled ?? true,
    emailDelayDays: row.email_delay_days ?? 1,
    callDelayDays: row.call_delay_days ?? 3,
    preferredEmailTime: row.preferred_email_time ?? "10:00",
    preferredCallTime: row.preferred_call_time ?? "16:00",
    schedulingCriteria: (row.scheduling_criteria as SchedulingCriteria) ?? {},
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Get config for a specific clinic
 */
export async function getConfig(
  supabase: SupabaseClientType,
  clinicId: string,
): Promise<AutoSchedulingConfig | null> {
  const { data, error } = await supabase
    .from("auto_scheduling_config")
    .select("*")
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error) {
    console.error("[ConfigService] Error fetching config:", error);
    throw error;
  }

  return data ? transformConfig(data) : null;
}

/**
 * Get or create config for a clinic (returns default if none exists)
 */
export async function getOrCreateConfig(
  supabase: SupabaseClientType,
  clinicId: string,
): Promise<AutoSchedulingConfig> {
  const existing = await getConfig(supabase, clinicId);
  if (existing) return existing;

  // Create default config
  const { data, error } = await supabase
    .from("auto_scheduling_config")
    .insert({
      clinic_id: clinicId,
      is_enabled: false,
      auto_email_enabled: true,
      auto_call_enabled: true,
      email_delay_days: 1,
      call_delay_days: 3,
      preferred_email_time: "10:00",
      preferred_call_time: "16:00",
      scheduling_criteria: {} as Json,
    })
    .select()
    .single();

  if (error) {
    console.error("[ConfigService] Error creating config:", error);
    throw error;
  }

  return transformConfig(data);
}

/**
 * Update config for a clinic
 */
export async function updateConfig(
  supabase: SupabaseClientType,
  clinicId: string,
  input: AutoSchedulingConfigInput,
): Promise<AutoSchedulingConfig> {
  // Ensure config exists
  await getOrCreateConfig(supabase, clinicId);

  const updates: Record<string, unknown> = {};

  if (input.isEnabled !== undefined) updates.is_enabled = input.isEnabled;
  if (input.autoEmailEnabled !== undefined)
    updates.auto_email_enabled = input.autoEmailEnabled;
  if (input.autoCallEnabled !== undefined)
    updates.auto_call_enabled = input.autoCallEnabled;
  if (input.emailDelayDays !== undefined)
    updates.email_delay_days = input.emailDelayDays;
  if (input.callDelayDays !== undefined)
    updates.call_delay_days = input.callDelayDays;
  if (input.preferredEmailTime !== undefined)
    updates.preferred_email_time = input.preferredEmailTime;
  if (input.preferredCallTime !== undefined)
    updates.preferred_call_time = input.preferredCallTime;
  if (input.schedulingCriteria !== undefined)
    updates.scheduling_criteria = input.schedulingCriteria as Json;

  const { data, error } = await supabase
    .from("auto_scheduling_config")
    .update(updates)
    .eq("clinic_id", clinicId)
    .select()
    .single();

  if (error) {
    console.error("[ConfigService] Error updating config:", error);
    throw error;
  }

  return transformConfig(data);
}

/**
 * Toggle enabled status for a clinic
 */
export async function toggleEnabled(
  supabase: SupabaseClientType,
  clinicId: string,
  enabled: boolean,
): Promise<AutoSchedulingConfig> {
  return updateConfig(supabase, clinicId, { isEnabled: enabled });
}

/**
 * Get all enabled clinics
 */
export async function getEnabledClinics(
  supabase: SupabaseClientType,
): Promise<AutoSchedulingConfig[]> {
  const { data, error } = await supabase
    .from("auto_scheduling_config")
    .select("*")
    .eq("is_enabled", true);

  if (error) {
    console.error("[ConfigService] Error fetching enabled clinics:", error);
    throw error;
  }

  return (data ?? []).map(transformConfig);
}

/**
 * Get all configs (for admin view)
 */
export async function getAllConfigs(
  supabase: SupabaseClientType,
): Promise<AutoSchedulingConfig[]> {
  const { data, error } = await supabase
    .from("auto_scheduling_config")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ConfigService] Error fetching all configs:", error);
    throw error;
  }

  return (data ?? []).map(transformConfig);
}

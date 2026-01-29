/**
 * Cadence Lookup Service
 *
 * Provides case type to scheduling delay mapping for auto-scheduling.
 * Looks up clinic-specific cadence configurations and falls back to defaults.
 *
 * @module domain/cases/cadence-lookup
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type { StandardizedCaseType } from "./case-helpers";

/**
 * Cadence configuration for a case type.
 * Determines auto-scheduling behavior and timing.
 */
export interface CadenceConfig {
  /** Whether to auto-schedule phone calls for this case type */
  autoScheduleCall: boolean;
  /** Whether to auto-schedule emails for this case type */
  autoScheduleEmail: boolean;
  /** Number of days to delay call after case creation */
  callDelayDays: number;
  /** Number of days to delay email after case creation */
  emailDelayDays: number;
  /** Preferred time for call (HH:MM format) */
  preferredCallTime: string;
  /** Preferred time for email (HH:MM format) */
  preferredEmailTime: string;
  /** If true, never auto-schedule for this case type (e.g., euthanasia) */
  neverAutoSchedule: boolean;
  /** Source of this configuration: 'default' | 'clinic_config' | 'manual' */
  source: "default" | "clinic_config" | "manual";
}

/**
 * Default cadence configurations by case type.
 * Used when no clinic-specific config exists.
 */
const DEFAULT_CADENCE: Record<
  StandardizedCaseType,
  Omit<CadenceConfig, "source">
> = {
  euthanasia: {
    autoScheduleCall: false,
    autoScheduleEmail: false,
    callDelayDays: 0,
    emailDelayDays: 0,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: true,
  },
  surgery: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 0,
    preferredCallTime: "14:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  wellness_exam: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 1,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  sick_visit: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 0,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  dental: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 0,
    preferredCallTime: "14:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  emergency: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 0,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  vaccination: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 1,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  follow_up: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 0,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
  general: {
    autoScheduleCall: true,
    autoScheduleEmail: true,
    callDelayDays: 1,
    emailDelayDays: 1,
    preferredCallTime: "10:00",
    preferredEmailTime: "09:00",
    neverAutoSchedule: false,
  },
};

/**
 * Get cadence configuration for a case type at a specific clinic.
 *
 * Looks up clinic-specific configuration in the clinic_case_type_cadence table.
 * Falls back to default configuration if no clinic-specific config exists.
 *
 * @param supabase - Supabase client (service or authenticated)
 * @param clinicId - Clinic ID to lookup configuration for
 * @param caseType - Standardized case type
 * @returns Cadence configuration for the case type
 */
export async function getCadenceForCaseType(
  supabase: SupabaseClient<Database>,
  clinicId: string | null,
  caseType: StandardizedCaseType,
): Promise<CadenceConfig> {
  // Start with defaults
  const defaults = DEFAULT_CADENCE[caseType];

  // If no clinic ID, return defaults
  if (!clinicId) {
    return { ...defaults, source: "default" };
  }

  // Look up clinic-specific configuration
  const { data: clinicConfig, error } = await supabase
    .from("clinic_case_type_cadence")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("case_type", caseType)
    .single();

  if (error || !clinicConfig) {
    // No clinic-specific config, use defaults
    return { ...defaults, source: "default" };
  }

  // Return clinic-specific configuration
  return {
    autoScheduleCall:
      clinicConfig.auto_schedule_call ?? defaults.autoScheduleCall,
    autoScheduleEmail:
      clinicConfig.auto_schedule_email ?? defaults.autoScheduleEmail,
    callDelayDays: clinicConfig.call_delay_days ?? defaults.callDelayDays,
    emailDelayDays: clinicConfig.email_delay_days ?? defaults.emailDelayDays,
    preferredCallTime:
      clinicConfig.preferred_call_time ?? defaults.preferredCallTime,
    preferredEmailTime:
      clinicConfig.preferred_email_time ?? defaults.preferredEmailTime,
    neverAutoSchedule:
      clinicConfig.never_auto_schedule ?? defaults.neverAutoSchedule,
    source: "clinic_config",
  };
}

/**
 * Get cadence configurations for all case types at a clinic.
 *
 * Useful for admin UI to show/edit all configurations.
 *
 * @param supabase - Supabase client
 * @param clinicId - Clinic ID
 * @returns Map of case type to cadence configuration
 */
export async function getAllCadenceForClinic(
  supabase: SupabaseClient<Database>,
  clinicId: string,
): Promise<Record<StandardizedCaseType, CadenceConfig>> {
  // Get all clinic-specific configurations
  const { data: clinicConfigs } = await supabase
    .from("clinic_case_type_cadence")
    .select("*")
    .eq("clinic_id", clinicId);

  // Build map with defaults, overriding with clinic-specific where available
  const result = {} as Record<StandardizedCaseType, CadenceConfig>;

  for (const caseType of Object.keys(
    DEFAULT_CADENCE,
  ) as StandardizedCaseType[]) {
    const clinicConfig = clinicConfigs?.find((c) => c.case_type === caseType);
    const defaults = DEFAULT_CADENCE[caseType];

    if (clinicConfig) {
      result[caseType] = {
        autoScheduleCall:
          clinicConfig.auto_schedule_call ?? defaults.autoScheduleCall,
        autoScheduleEmail:
          clinicConfig.auto_schedule_email ?? defaults.autoScheduleEmail,
        callDelayDays: clinicConfig.call_delay_days ?? defaults.callDelayDays,
        emailDelayDays:
          clinicConfig.email_delay_days ?? defaults.emailDelayDays,
        preferredCallTime:
          clinicConfig.preferred_call_time ?? defaults.preferredCallTime,
        preferredEmailTime:
          clinicConfig.preferred_email_time ?? defaults.preferredEmailTime,
        neverAutoSchedule:
          clinicConfig.never_auto_schedule ?? defaults.neverAutoSchedule,
        source: "clinic_config",
      };
    } else {
      result[caseType] = { ...defaults, source: "default" };
    }
  }

  return result;
}

/**
 * Check if a case type should be auto-scheduled.
 *
 * Quick helper that combines cadence lookup with neverAutoSchedule check.
 *
 * @param supabase - Supabase client
 * @param clinicId - Clinic ID
 * @param caseType - Standardized case type
 * @returns Object with call/email enabled flags
 */
export async function shouldAutoSchedule(
  supabase: SupabaseClient<Database>,
  clinicId: string | null,
  caseType: StandardizedCaseType,
): Promise<{ callEnabled: boolean; emailEnabled: boolean }> {
  const cadence = await getCadenceForCaseType(supabase, clinicId, caseType);

  if (cadence.neverAutoSchedule) {
    return { callEnabled: false, emailEnabled: false };
  }

  return {
    callEnabled: cadence.autoScheduleCall,
    emailEnabled: cadence.autoScheduleEmail,
  };
}

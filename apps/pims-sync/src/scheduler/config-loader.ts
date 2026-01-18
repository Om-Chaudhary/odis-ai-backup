/**
 * Config Loader - Loads per-clinic sync schedules from database
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("scheduler:config-loader");

export interface ClinicSyncSchedule {
  type: "inbound" | "cases" | "reconciliation";
  cron: string;
  enabled: boolean;
}

export interface ClinicScheduleConfig {
  clinicId: string;
  clinicName: string;
  schedules: ClinicSyncSchedule[];
}

/**
 * Load all clinic sync schedules from database
 */
export async function loadClinicSchedules(
  supabase: SupabaseClient<Database>,
): Promise<ClinicScheduleConfig[]> {
  logger.info("Loading clinic sync schedules...");

  try {
    // Query clinic_schedule_configs with sync_schedules
    // Note: Using 'any' type assertion as clinic_schedule_configs table
    // is not yet in generated Database types (requires migration + type regen)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    const { data, error } = await (supabase as any)
      .from("clinic_schedule_configs")
      .select(
        `
        clinic_id,
        sync_schedules,
        clinics!inner (
          name
        )
      `,
      )
      .not("sync_schedules", "is", null);

    if (error) {
      logger.error("Failed to load clinic schedules", { error: error.message });
      throw new Error(`Failed to load clinic schedules: ${error.message}`);
    }

    if (!data || data.length === 0) {
      logger.warn("No clinic schedules found in database");
      return [];
    }

    // Parse and validate schedules
    const configs: ClinicScheduleConfig[] = [];

    for (const row of data) {
      try {
        const schedules = parseSchedules(row.sync_schedules);

        if (schedules.length === 0) {
          logger.debug("No schedules configured for clinic", {
            clinicId: row.clinic_id,
          });
          continue;
        }

        const clinicName =
          Array.isArray(row.clinics) && row.clinics[0]?.name
            ? row.clinics[0].name
            : "Unknown";

        configs.push({
          clinicId: row.clinic_id,
          clinicName,
          schedules,
        });

        logger.info("Loaded clinic schedule config", {
          clinicId: row.clinic_id,
          clinicName,
          schedulesCount: schedules.length,
        });
      } catch (error) {
        logger.error("Failed to parse clinic schedule", {
          clinicId: row.clinic_id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    logger.info("Loaded clinic schedules", {
      totalClinics: configs.length,
      totalSchedules: configs.reduce((sum, c) => sum + c.schedules.length, 0),
    });

    return configs;
  } catch (error) {
    logger.error("Error loading clinic schedules", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Parse and validate sync_schedules JSONB field
 */
function parseSchedules(syncSchedules: unknown): ClinicSyncSchedule[] {
  if (!syncSchedules) {
    return [];
  }

  // Handle JSONB array
  const schedulesArray = Array.isArray(syncSchedules) ? syncSchedules : [];

  const validSchedules: ClinicSyncSchedule[] = [];

  for (const schedule of schedulesArray) {
    if (!isValidSchedule(schedule)) {
      logger.warn("Invalid schedule config, skipping", { schedule });
      continue;
    }

    validSchedules.push({
      type: schedule.type,
      cron: schedule.cron,
      enabled: schedule.enabled ?? true,
    });
  }

  return validSchedules;
}

/**
 * Type guard for schedule validation
 */
function isValidSchedule(schedule: unknown): schedule is ClinicSyncSchedule {
  if (!schedule || typeof schedule !== "object") {
    return false;
  }

  const s = schedule as Record<string, unknown>;

  // Check required fields
  if (typeof s.type !== "string" || typeof s.cron !== "string") {
    return false;
  }

  // Validate type enum
  if (!["inbound", "cases", "reconciliation"].includes(s.type)) {
    return false;
  }

  // enabled is optional boolean
  if (s.enabled !== undefined && typeof s.enabled !== "boolean") {
    return false;
  }

  return true;
}

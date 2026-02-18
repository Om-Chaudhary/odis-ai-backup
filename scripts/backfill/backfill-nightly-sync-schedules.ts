#!/usr/bin/env npx tsx
/**
 * Backfill Nightly Sync Schedules
 *
 * Description: Populates sync_schedules in clinic_schedule_config for clinics
 * with IDEXX credentials. Generates per-clinic nightly cron expressions based
 * on close_time + 30 minutes. The pims-sync SyncScheduler reads these to
 * schedule nightly inbound appointment syncs.
 *
 * Usage: pnpm tsx scripts/backfill/backfill-nightly-sync-schedules.ts [options]
 *
 * Options:
 *   --dry-run       Show what would happen without making changes
 *   --verbose       Show detailed output
 *   --clinic-id=ID  Only process a specific clinic
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 *
 * Examples:
 *   pnpm tsx scripts/backfill/backfill-nightly-sync-schedules.ts --dry-run
 *   pnpm tsx scripts/backfill/backfill-nightly-sync-schedules.ts --clinic-id=abc-123 --verbose
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });

const args = parseScriptArgs({
  flags: {
    "clinic-id": { type: "string" },
  },
});

interface DailyHours {
  [day: string]: {
    open?: string;
    close?: string;
    enabled?: boolean;
  };
}

/**
 * Get the latest close time across all enabled days from daily_hours config.
 * Returns hours and minutes.
 */
function getLatestCloseTime(
  dailyHours: DailyHours | null,
  fallbackCloseTime: string,
): { hour: number; minute: number } {
  let latestMinutes = 0;

  if (dailyHours) {
    for (const day of Object.values(dailyHours)) {
      if (day.enabled && day.close) {
        const [h, m] = day.close.split(":").map(Number);
        const totalMinutes = h * 60 + m;
        if (totalMinutes > latestMinutes) {
          latestMinutes = totalMinutes;
        }
      }
    }
  }

  // Fallback to close_time column
  if (latestMinutes === 0 && fallbackCloseTime) {
    const [h, m] = fallbackCloseTime.split(":").map(Number);
    latestMinutes = h * 60 + m;
  }

  // Default to 6 PM if nothing found
  if (latestMinutes === 0) {
    latestMinutes = 18 * 60;
  }

  // Add 30 minutes for the sync window
  latestMinutes += 30;

  return {
    hour: Math.floor(latestMinutes / 60),
    minute: latestMinutes % 60,
  };
}

/**
 * Get enabled days of week from daily_hours config.
 * Returns cron day-of-week expression (0=Sun, 1=Mon, etc.)
 */
function getEnabledDaysCron(dailyHours: DailyHours | null): string {
  if (!dailyHours) return "*";

  const enabledDays: number[] = [];
  for (const [day, config] of Object.entries(dailyHours)) {
    if (config.enabled) {
      enabledDays.push(parseInt(day));
    }
  }

  if (enabledDays.length === 0 || enabledDays.length === 7) return "*";

  return enabledDays.sort((a, b) => a - b).join(",");
}

async function main(): Promise<void> {
  scriptLog.header("Backfill Nightly Sync Schedules");

  const supabase = createScriptSupabaseClient();

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }

  // Find clinics with IDEXX credentials
  let query = supabase
    .from("clinics")
    .select(
      "id, name, timezone",
    )
    .eq("is_active", true);

  if (args["clinic-id"]) {
    query = query.eq("id", args["clinic-id"]);
  }

  const { data: clinics, error: clinicError } = await query;

  if (clinicError) {
    scriptLog.error("Failed to fetch clinics:", clinicError.message);
    throw clinicError;
  }

  if (!clinics || clinics.length === 0) {
    scriptLog.info("No active clinics found");
    return;
  }

  // Filter to clinics with IDEXX credentials
  const clinicsWithCreds: typeof clinics = [];
  for (const clinic of clinics) {
    const { data: creds } = await supabase
      .from("idexx_credentials")
      .select("id")
      .eq("clinic_id", clinic.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (creds) {
      clinicsWithCreds.push(clinic);
    }
  }

  if (clinicsWithCreds.length === 0) {
    scriptLog.info("No clinics with active IDEXX credentials found");
    return;
  }

  scriptLog.info(
    `Found ${clinicsWithCreds.length} clinics with IDEXX credentials`,
  );

  let updated = 0;
  let skipped = 0;

  for (const clinic of clinicsWithCreds) {
    // Get the clinic's schedule config
    const { data: config } = await supabase
      .from("clinic_schedule_config")
      .select("clinic_id, close_time, daily_hours, sync_schedules")
      .eq("clinic_id", clinic.id)
      .single();

    if (!config) {
      scriptLog.warn(`No schedule config for ${clinic.name} (${clinic.id})`);
      skipped++;
      continue;
    }

    // Check if sync_schedules is already populated with real data
    const existingSchedules = config.sync_schedules as unknown[];
    if (
      Array.isArray(existingSchedules) &&
      existingSchedules.length > 0
    ) {
      scriptLog.info(
        `${clinic.name} already has ${existingSchedules.length} sync schedule(s) — skipping`,
      );
      skipped++;
      continue;
    }

    const dailyHours = config.daily_hours as DailyHours | null;
    const { hour, minute } = getLatestCloseTime(
      dailyHours,
      config.close_time ?? "18:00",
    );
    const daysCron = getEnabledDaysCron(dailyHours);

    // Build the nightly inbound sync schedule
    const syncSchedules = [
      {
        type: "inbound",
        cron: `${minute} ${hour} * * ${daysCron}`,
        enabled: true,
      },
    ];

    if (args.verbose) {
      scriptLog.info(
        `${clinic.name}: close_time=${config.close_time}, sync cron="${syncSchedules[0].cron}" (${clinic.timezone})`,
      );
    }

    if (args.dryRun) {
      scriptLog.dryRun(
        `Would set sync_schedules for ${clinic.name}: ${JSON.stringify(syncSchedules)}`,
      );
    } else {
      const { error: updateError } = await supabase
        .from("clinic_schedule_config")
        .update({ sync_schedules: syncSchedules })
        .eq("clinic_id", clinic.id);

      if (updateError) {
        scriptLog.error(
          `Failed to update ${clinic.name}: ${updateError.message}`,
        );
        continue;
      }
    }

    updated++;
  }

  scriptLog.divider();
  scriptLog.success(`Updated: ${updated}`);
  if (skipped > 0) {
    scriptLog.info(`Skipped: ${skipped}`);
  }
  scriptLog.success("Done!");
}

main().catch((error) => {
  scriptLog.error("Script failed:", error);
  process.exit(1);
});

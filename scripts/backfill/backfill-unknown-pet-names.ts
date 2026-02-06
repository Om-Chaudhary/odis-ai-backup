#!/usr/bin/env npx tsx
/**
 * Backfill Script: Fix Unknown Pet Names in Discharge Calls
 *
 * This script fixes historical discharge calls that have "unknown" as pet_name
 * when the database actually has the correct patient name.
 *
 * Usage:
 *   pnpm tsx scripts/backfill/backfill-unknown-pet-names.ts [options]
 *
 * Options:
 *   --dry-run     Show what would be updated without making changes
 *   --limit=N     Limit to N records (default: 1000)
 *   --verbose     Show detailed output
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

// Load environment variables
loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });

// Parse CLI arguments
const args = parseScriptArgs();
const limit = args.limit ?? 1000;

interface BackfillStats {
  total: number;
  fixed: number;
  skipped: number;
  errors: number;
  details: Array<{
    callId: string;
    caseId: string;
    oldPetName: string;
    newPetName: string;
    oldOwnerName: string;
    newOwnerName: string;
  }>;
}

async function backfillUnknownPetNames(): Promise<BackfillStats> {
  const supabase = createScriptSupabaseClient();

  const stats: BackfillStats = {
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  scriptLog.header("Backfill Unknown Pet Names");

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }
  scriptLog.info(`Limit: ${limit} records`);

  // Find all discharge calls with "unknown" pet_name where database has real name
  const { data: calls, error } = await supabase
    .from("scheduled_discharge_calls")
    .select(
      `
      id,
      case_id,
      dynamic_variables,
      cases!inner(
        id,
        patients(
          id,
          name,
          owner_name,
          owner_phone,
          owner_email
        )
      )
    `,
    )
    .or(
      "dynamic_variables->>pet_name.eq.unknown,dynamic_variables->>owner_name.eq.unknown,dynamic_variables->>patient_name.eq.unknown",
    )
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    scriptLog.error("Error fetching discharge calls:", error);
    throw error;
  }

  if (!calls || calls.length === 0) {
    scriptLog.info("No discharge calls found with unknown values.");
    return stats;
  }

  stats.total = calls.length;
  scriptLog.info(`Found ${stats.total} discharge calls with unknown values`);

  for (const call of calls) {
    try {
      // @ts-expect-error - Supabase select typing issue with nested relations
      const patient = call.cases?.patients?.[0] ?? call.cases?.patients;

      if (!patient) {
        if (args.verbose) {
          scriptLog.debug(
            `Skip call ${call.id}: No patient record found for case ${call.case_id}`,
          );
        }
        stats.skipped++;
        continue;
      }

      const dynamicVars = call.dynamic_variables as Record<string, unknown>;
      const currentPetName = dynamicVars.pet_name as string;
      const currentOwnerName = dynamicVars.owner_name as string;

      // Check if we have a real patient name to update to
      const hasRealPatientName =
        patient.name &&
        patient.name.trim() !== "" &&
        patient.name.toLowerCase() !== "unknown";

      const hasRealOwnerName =
        patient.owner_name &&
        patient.owner_name.trim() !== "" &&
        patient.owner_name.toLowerCase() !== "unknown";

      if (!hasRealPatientName && !hasRealOwnerName) {
        if (args.verbose) {
          scriptLog.debug(
            `Skip call ${call.id}: Patient record also has unknown values`,
          );
        }
        stats.skipped++;
        continue;
      }

      // Build updated variables
      const updatedVars: Record<string, unknown> = {
        ...dynamicVars,
      };

      let changed = false;

      if (hasRealPatientName && currentPetName === "unknown") {
        updatedVars.pet_name = patient.name;
        updatedVars.patient_name = patient.name;
        changed = true;
      }

      if (hasRealOwnerName && currentOwnerName === "unknown") {
        updatedVars.owner_name = patient.owner_name;
        updatedVars.owner_name_extracted = patient.owner_name;
        changed = true;
      }

      // Add owner contact info if available
      if (patient.owner_phone && patient.owner_phone !== "unknown") {
        updatedVars.owner_phone_extracted = patient.owner_phone;
      }
      if (patient.owner_email && patient.owner_email !== "unknown") {
        updatedVars.owner_email_extracted = patient.owner_email;
      }

      if (!changed) {
        if (args.verbose) {
          scriptLog.debug(`Skip call ${call.id}: No changes needed`);
        }
        stats.skipped++;
        continue;
      }

      const detail = {
        callId: call.id,
        caseId: call.case_id,
        oldPetName: currentPetName,
        newPetName: updatedVars.pet_name as string,
        oldOwnerName: currentOwnerName,
        newOwnerName: updatedVars.owner_name as string,
      };

      stats.details.push(detail);

      if (args.verbose) {
        scriptLog.info(`Update call ${call.id}:`);
        scriptLog.debug(
          `  Pet Name: "${currentPetName}" -> "${updatedVars.pet_name}"`,
        );
        scriptLog.debug(
          `  Owner Name: "${currentOwnerName}" -> "${updatedVars.owner_name}"`,
        );
      }

      if (!args.dryRun) {
        const { error: updateError } = await supabase
          .from("scheduled_discharge_calls")
          .update({ dynamic_variables: updatedVars })
          .eq("id", call.id);

        if (updateError) {
          scriptLog.error(`Error updating call ${call.id}:`, updateError);
          stats.errors++;
        } else {
          stats.fixed++;
        }
      } else {
        stats.fixed++;
      }

      // Show progress for larger datasets
      if (stats.total > 10) {
        scriptLog.progress(
          stats.fixed + stats.skipped + stats.errors,
          stats.total,
        );
      }
    } catch (err) {
      scriptLog.error(`Error processing call ${call.id}:`, err);
      stats.errors++;
    }
  }

  return stats;
}

async function main() {
  try {
    const stats = await backfillUnknownPetNames();

    scriptLog.divider();
    scriptLog.header("Summary");
    scriptLog.info(`Total records processed: ${stats.total}`);
    scriptLog.success(`Successfully fixed: ${stats.fixed}`);
    if (stats.skipped > 0) scriptLog.warn(`Skipped: ${stats.skipped}`);
    if (stats.errors > 0) scriptLog.error(`Errors: ${stats.errors}`);

    if (args.dryRun) {
      scriptLog.info("Run without --dry-run to apply changes");
    } else {
      scriptLog.success("Backfill complete!");
    }

    if (args.verbose && stats.details.length > 0) {
      scriptLog.divider();
      scriptLog.header("Changes Detail (first 10)");
      stats.details.slice(0, 10).forEach((detail) => {
        scriptLog.info(`Call ${detail.callId}:`);
        scriptLog.debug(`  Case: ${detail.caseId}`);
        scriptLog.debug(
          `  Pet: "${detail.oldPetName}" -> "${detail.newPetName}"`,
        );
        scriptLog.debug(
          `  Owner: "${detail.oldOwnerName}" -> "${detail.newOwnerName}"`,
        );
      });

      if (stats.details.length > 10) {
        scriptLog.info(`... and ${stats.details.length - 10} more changes`);
      }
    }

    process.exit(0);
  } catch (error) {
    scriptLog.error("Backfill failed:", error);
    process.exit(1);
  }
}

main();

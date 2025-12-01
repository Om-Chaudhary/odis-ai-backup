/**
 * Backfill Script: Fix Unknown Pet Names in Discharge Calls
 *
 * This script fixes historical discharge calls that have "unknown" as pet_name
 * when the database actually has the correct patient name.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-unknown-pet-names.ts [--dry-run] [--limit=N]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --limit=N    Limit to N records (default: 1000)
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/database.types.js";

// Load environment variables from .env.local
config({ path: ".env.local" });

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

async function backfillUnknownPetNames(
  dryRun: boolean = false,
  limit: number = 1000,
): Promise<BackfillStats> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  const stats: BackfillStats = {
    total: 0,
    fixed: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  console.log("Starting backfill of unknown pet names...");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Limit: ${limit} records\n`);

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
      'dynamic_variables->>pet_name.eq.unknown,dynamic_variables->>owner_name.eq.unknown,dynamic_variables->>patient_name.eq.unknown',
    )
    .limit(limit)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching discharge calls:", error);
    throw error;
  }

  if (!calls || calls.length === 0) {
    console.log("No discharge calls found with unknown values.");
    return stats;
  }

  stats.total = calls.length;
  console.log(`Found ${stats.total} discharge calls with unknown values\n`);

  for (const call of calls) {
    try {
      // @ts-expect-error - Supabase select typing issue with nested relations
      const patient = call.cases?.patients?.[0] ?? call.cases?.patients;

      if (!patient) {
        console.log(
          `[SKIP] Call ${call.id}: No patient record found for case ${call.case_id}`,
        );
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
        console.log(
          `[SKIP] Call ${call.id}: Patient record also has unknown values`,
        );
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
        console.log(`[SKIP] Call ${call.id}: No changes needed`);
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

      console.log(`[UPDATE] Call ${call.id}:`);
      console.log(`  Pet Name: "${currentPetName}" → "${updatedVars.pet_name}"`);
      console.log(
        `  Owner Name: "${currentOwnerName}" → "${updatedVars.owner_name}"`,
      );

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from("scheduled_discharge_calls")
          .update({ dynamic_variables: updatedVars })
          .eq("id", call.id);

        if (updateError) {
          console.error(`  ❌ Error updating call ${call.id}:`, updateError);
          stats.errors++;
        } else {
          console.log(`  ✅ Updated successfully`);
          stats.fixed++;
        }
      } else {
        console.log(`  (DRY RUN - no changes made)`);
        stats.fixed++;
      }

      console.log("");
    } catch (err) {
      console.error(`Error processing call ${call.id}:`, err);
      stats.errors++;
    }
  }

  return stats;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "1000") : 1000;

  try {
    const stats = await backfillUnknownPetNames(dryRun, limit);

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records processed: ${stats.total}`);
    console.log(`Successfully fixed: ${stats.fixed}`);
    console.log(`Skipped (no changes needed): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (dryRun) {
      console.log("\n⚠️  DRY RUN MODE - No actual changes were made");
      console.log("Run without --dry-run to apply changes");
    } else {
      console.log("\n✅ Backfill complete!");
    }

    if (stats.details.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("CHANGES DETAIL");
      console.log("=".repeat(60));
      stats.details.slice(0, 10).forEach((detail) => {
        console.log(`\nCall ID: ${detail.callId}`);
        console.log(`  Case ID: ${detail.caseId}`);
        console.log(`  Pet: "${detail.oldPetName}" → "${detail.newPetName}"`);
        console.log(
          `  Owner: "${detail.oldOwnerName}" → "${detail.newOwnerName}"`,
        );
      });

      if (stats.details.length > 10) {
        console.log(
          `\n... and ${stats.details.length - 10} more changes (showing first 10)`,
        );
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Backfill failed:", error);
    process.exit(1);
  }
}

main();

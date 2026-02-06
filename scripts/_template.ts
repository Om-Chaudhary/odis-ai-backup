#!/usr/bin/env npx tsx
/**
 * Script Name
 *
 * Description: Brief description of what this script does
 *
 * Usage: pnpm tsx scripts/category/script-name.ts [options]
 *
 * Options:
 *   --dry-run     Show what would happen without making changes
 *   --verbose     Show detailed output
 *   --limit=N     Limit number of records to process
 *   --days=N      Filter to last N days
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 *
 * Examples:
 *   pnpm tsx scripts/category/script-name.ts --dry-run
 *   pnpm tsx scripts/category/script-name.ts --limit=10 --verbose
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

// Load environment variables and validate required ones
loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });

// Parse CLI arguments
const args = parseScriptArgs({
  flags: {
    // Add custom flags here if needed
    // "clinic-id": { type: "string" },
    // "force": { type: "boolean", default: false },
  },
});

async function main(): Promise<void> {
  scriptLog.header("Script Name");

  // Create Supabase client for database access
  const supabase = createScriptSupabaseClient();

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }

  if (args.verbose) {
    scriptLog.debug("Verbose mode enabled");
    scriptLog.debug("Arguments:", args);
  }

  // Example: Fetch data with optional limit
  const query = supabase.from("your_table").select("*");

  if (args.limit) {
    query.limit(args.limit);
  }

  const { data, error } = await query;

  if (error) {
    scriptLog.error("Failed to fetch data:", error.message);
    throw error;
  }

  if (!data || data.length === 0) {
    scriptLog.info("No records found to process");
    return;
  }

  scriptLog.info(`Found ${data.length} records to process`);

  // Process records with progress tracking
  let processed = 0;
  let skipped = 0;

  for (const record of data) {
    if (args.verbose) {
      scriptLog.debug(`Processing record ${record.id}`);
    }

    // Skip logic example
    if (false /* condition to skip */) {
      skipped++;
      continue;
    }

    if (args.dryRun) {
      scriptLog.dryRun(`Would process record ${record.id}`);
    } else {
      // Actual processing logic here
      // await supabase.from("your_table").update({ ... }).eq("id", record.id);
    }

    processed++;

    // Show progress for larger datasets
    if (data.length > 10) {
      scriptLog.progress(processed + skipped, data.length);
    }
  }

  // Summary
  scriptLog.divider();
  scriptLog.success(`Processed: ${processed}`);
  if (skipped > 0) {
    scriptLog.warn(`Skipped: ${skipped}`);
  }
  scriptLog.success("Done!");
}

// Run the script
main().catch((error) => {
  scriptLog.error("Script failed:", error);
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * Sync VAPI Assistant Configurations
 *
 * Synchronizes assistant configurations from the database to VAPI.
 * Supports dry-run mode, filtering by clinic, and selective sync.
 *
 * Usage:
 *   npx tsx scripts/sync-vapi-assistants.ts --dry-run
 *   npx tsx scripts/sync-vapi-assistants.ts --clinic=alum-rock
 *   npx tsx scripts/sync-vapi-assistants.ts --all
 *   npx tsx scripts/sync-vapi-assistants.ts --tools-only
 *   npx tsx scripts/sync-vapi-assistants.ts --prompts-only
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for admin access
 *   VAPI_API_KEY - VAPI API key for assistant management
 */

import { createClient } from "@supabase/supabase-js";
import { parseArgs } from "util";

import {
  loadAssistantConfigs,
  syncAssistant,
  updateSyncStatus,
  type SyncOptions,
} from "../libs/integrations/vapi/src/assistant-manager";

const args = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    clinic: { type: "string" },
    type: { type: "string" },
    all: { type: "boolean", default: false },
    "tools-only": { type: "boolean", default: false },
    "prompts-only": { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

if (args.values.help) {
  console.log(`
VAPI Assistant Sync Script

Synchronizes assistant configurations from database to VAPI.

Options:
  --dry-run        Show what would change without applying
  --clinic=<slug>  Sync specific clinic only (e.g., --clinic=alum-rock)
  --type=<type>    Filter by type (inbound | outbound)
  --all            Sync all active assistants
  --tools-only     Only sync tool bindings
  --prompts-only   Only sync system prompts
  --help           Show this help

Environment Variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Service role key
  VAPI_API_KEY              VAPI API key

Examples:
  # Preview changes for all assistants
  npx tsx scripts/sync-vapi-assistants.ts --dry-run --all

  # Sync only Alum Rock assistants
  npx tsx scripts/sync-vapi-assistants.ts --clinic=alum-rock

  # Update only tool bindings
  npx tsx scripts/sync-vapi-assistants.ts --all --tools-only
  `);
  process.exit(0);
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapiKey = process.env.VAPI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    console.error("Set these environment variables and try again.");
    process.exit(1);
  }

  if (!vapiKey) {
    console.error("Error: Missing VAPI_API_KEY");
    console.error("Set this environment variable and try again.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const options: SyncOptions = {
    dryRun: args.values["dry-run"] ?? false,
    clinicSlug: args.values.clinic,
    assistantType: args.values.type as "inbound" | "outbound" | undefined,
    toolsOnly: args.values["tools-only"] ?? false,
    promptsOnly: args.values["prompts-only"] ?? false,
  };

  // Header
  console.log("\n====================================================");
  console.log("  VAPI Assistant Sync");
  console.log("====================================================");
  console.log(`Mode: ${options.dryRun ? "DRY RUN (no changes)" : "LIVE"}`);
  if (options.clinicSlug) console.log(`Clinic: ${options.clinicSlug}`);
  if (options.assistantType) console.log(`Type: ${options.assistantType}`);
  if (options.toolsOnly) console.log(`Scope: Tools only`);
  if (options.promptsOnly) console.log(`Scope: Prompts only`);
  console.log("====================================================\n");

  // Load configs
  console.log("Loading assistant configurations...");
  const configs = await loadAssistantConfigs(supabase, options);
  console.log(`Found ${configs.length} assistant(s) to sync\n`);

  if (configs.length === 0) {
    console.log("No assistants to sync. Exiting.");
    return;
  }

  // Track stats
  let synced = 0;
  let unchanged = 0;
  let failed = 0;

  // Sync each assistant
  for (const config of configs) {
    console.log(`\n--------------------------------------------------`);
    console.log(`${config.clinicSlug} / ${config.assistantType}`);
    console.log(`Assistant ID: ${config.id}`);
    console.log(`--------------------------------------------------`);

    const result = await syncAssistant(config, options);

    if (result.changes.length === 0) {
      console.log("  No changes needed");
      unchanged++;
    } else {
      for (const change of result.changes) {
        const icon =
          change.action === "add"
            ? "+"
            : change.action === "remove"
              ? "-"
              : "~";
        console.log(`  ${icon} ${change.field}: ${change.action}`);
        if (change.oldValue !== undefined) {
          console.log(`    Old: ${JSON.stringify(change.oldValue)}`);
        }
        if (change.newValue !== undefined) {
          console.log(`    New: ${JSON.stringify(change.newValue)}`);
        }
      }

      if (!options.dryRun) {
        if (result.success) {
          console.log("  Applied successfully");
          await updateSyncStatus(supabase, config.id, "synced");
          synced++;
        } else {
          console.log(`  FAILED: ${result.error}`);
          await updateSyncStatus(supabase, config.id, "error");
          failed++;
        }
      } else {
        synced++; // Count as "would sync"
      }
    }
  }

  // Summary
  console.log("\n====================================================");
  console.log("  Summary");
  console.log("====================================================");
  if (options.dryRun) {
    console.log(`Would sync: ${synced}`);
    console.log(`No changes: ${unchanged}`);
  } else {
    console.log(`Synced: ${synced}`);
    console.log(`Unchanged: ${unchanged}`);
    console.log(`Failed: ${failed}`);
  }
  console.log("====================================================\n");
}

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});

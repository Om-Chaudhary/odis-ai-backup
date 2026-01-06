#!/usr/bin/env tsx

/**
 * Backfill Tool-Based Inbound Call Outcomes
 *
 * This script comprehensively backfills ALL inbound call outcomes to match the new 4-category pattern:
 * 1. Appointment (scheduled/rescheduled/cancelled) - when alum_rock_book_appointment tool used
 * 2. Emergency (emergency triage) - when log_emergency_triage tool used
 * 3. Callback (client requests callback) - when leave_message tool used
 * 4. Info (clinic information only) - when call completed >30s without specific tools
 * 5. null (blank) - all other calls
 *
 * This matches the logic implemented in the end-of-call-report webhook handler.
 *
 * Usage:
 *   pnpm tsx apps/web/src/scripts/backfill-tool-based-outcomes.ts [--dry-run] [--since YYYY-MM-DD]
 *
 * Options:
 *   --dry-run       Preview changes without updating database
 *   --since DATE    Only process calls since this date (default: all calls)
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Types
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface ToolCall {
  function?: {
    name?: string;
    arguments?: string;
  };
  type?: string;
}

interface TranscriptMessage {
  role: string;
  toolCalls?: ToolCall[];
  message?: string;
  time?: number;
}

interface OutcomeStats {
  scheduled: number;
  emergency: number;
  callback: number;
  info: number;
  blank: number;
  total: number;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sinceIndex = args.indexOf("--since");
  const since = sinceIndex !== -1 ? args[sinceIndex + 1] : null;

  return { dryRun, since };
}

/**
 * Determine outcome based on tool calls
 * This mirrors the logic in end-of-call-report webhook handler
 */
function determineOutcome(
  call: Pick<
    InboundCall,
    "transcript_messages" | "status" | "duration_seconds"
  >,
): string | null {
  // Parse transcript_messages JSONB
  const messages =
    (call.transcript_messages as unknown as TranscriptMessage[]) ?? [];

  // Find all assistant messages with tool calls
  const toolCalls = messages.filter(
    (msg) =>
      msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0,
  );

  // Check which tools were invoked during the call
  const hasAppointmentTool = toolCalls.some((msg) =>
    msg.toolCalls?.some(
      (tc) => tc.function?.name === "alum_rock_book_appointment",
    ),
  );

  const hasEmergencyTool = toolCalls.some((msg) =>
    msg.toolCalls?.some((tc) => tc.function?.name === "log_emergency_triage"),
  );

  const hasCallbackTool = toolCalls.some((msg) =>
    msg.toolCalls?.some((tc) => tc.function?.name === "leave_message"),
  );

  // Priority order: appointment > emergency > callback > info
  if (hasAppointmentTool) {
    return "scheduled"; // Maps to "Schedule Appointment" in frontend
  } else if (hasEmergencyTool) {
    return "emergency"; // Maps to "Emergency Triage" in frontend
  } else if (hasCallbackTool) {
    return "callback"; // Maps to "Client Requests Callback" in frontend
  } else if (
    call.status === "completed" &&
    call.duration_seconds &&
    call.duration_seconds > 30
  ) {
    // Call completed without specific tools - likely just info request
    return "info"; // Maps to "Clinic Info" in frontend
  }

  // No outcome - will show no badge in dashboard
  return null;
}

/**
 * Get human-readable label for outcome
 */
function getOutcomeLabel(outcome: string | null): string {
  const labels: Record<string, string> = {
    scheduled: "Appointment",
    emergency: "Emergency Triage",
    callback: "Callback Request",
    info: "Clinic Info",
  };
  return outcome ? (labels[outcome] ?? outcome) : "(blank)";
}

/**
 * Main backfill function
 */
async function backfillToolBasedOutcomes() {
  const { dryRun, since } = parseArgs();

  console.log("🚀 Starting tool-based inbound call outcomes backfill...\n");
  console.log(`Mode: ${dryRun ? "DRY RUN (preview only)" : "LIVE UPDATE"}`);

  if (since) {
    console.log(`Date filter: Processing calls since ${since}`);
  } else {
    console.log("Date filter: Processing ALL calls");
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Build query
  let query = supabase
    .from("inbound_vapi_calls")
    .select(
      "id, vapi_call_id, outcome, status, duration_seconds, transcript_messages, created_at",
    )
    .order("created_at", { ascending: true });

  // Apply date filter if provided
  if (since) {
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      console.error("❌ Invalid date format. Use YYYY-MM-DD");
      process.exit(1);
    }
    query = query.gte("created_at", sinceDate.toISOString());
  }

  // Fetch all calls
  console.log("📡 Fetching calls from database...\n");
  const { data: calls, error: queryError } = await query;

  if (queryError) {
    console.error("❌ Failed to query database:", queryError);
    process.exit(1);
  }

  if (!calls || calls.length === 0) {
    console.log("✅ No calls found to process!");
    return;
  }

  console.log(`📊 Found ${calls.length} calls to process\n`);
  console.log("=".repeat(80) + "\n");

  // Track statistics
  const stats: OutcomeStats = {
    scheduled: 0,
    emergency: 0,
    callback: 0,
    info: 0,
    blank: 0,
    total: 0,
  };

  let updateCount = 0;
  let noChangeCount = 0;
  let errorCount = 0;

  // Process each call
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i]!;
    const progress = `[${i + 1}/${calls.length}]`;

    // Determine new outcome
    const newOutcome = determineOutcome(call);
    const newLabel = getOutcomeLabel(newOutcome);

    // Track in stats
    if (newOutcome === "scheduled") stats.scheduled++;
    else if (newOutcome === "emergency") stats.emergency++;
    else if (newOutcome === "callback") stats.callback++;
    else if (newOutcome === "info") stats.info++;
    else stats.blank++;
    stats.total++;

    // Check if outcome needs updating
    const currentOutcome = call.outcome;
    const needsUpdate = currentOutcome !== newOutcome;

    // Log progress
    if (needsUpdate) {
      console.log(
        `${progress} ${needsUpdate ? "🔄 UPDATING" : "✓ No change"}: ${call.vapi_call_id}`,
      );
      console.log(`   Old outcome: ${currentOutcome ?? "(null)"}`);
      console.log(`   New outcome: ${newOutcome ?? "(null)"} → ${newLabel}`);
      console.log(
        `   Status: ${call.status}, Duration: ${call.duration_seconds ?? 0}s`,
      );
      console.log(`   Created: ${call.created_at}`);
    }

    // Update database if needed (and not dry run)
    if (needsUpdate && !dryRun) {
      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update({ outcome: newOutcome })
        .eq("id", call.id);

      if (updateError) {
        console.log(`   ❌ Update failed:`, updateError);
        errorCount++;
      } else {
        console.log(`   ✅ Updated successfully`);
        updateCount++;
      }
    } else if (needsUpdate && dryRun) {
      console.log(`   📝 Would update (dry run mode)`);
      updateCount++; // Count what would be updated
    } else {
      noChangeCount++;
    }

    // Add spacing between entries for readability (only for updates)
    if (needsUpdate && i < calls.length - 1) {
      console.log("");
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("\n📊 BACKFILL SUMMARY");
  console.log("=".repeat(80));
  console.log(`Total calls processed: ${stats.total}`);
  console.log(``);
  console.log(`Outcome Distribution:`);
  console.log(
    `  📅 Appointment (scheduled): ${stats.scheduled} (${((stats.scheduled / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  🚨 Emergency Triage: ${stats.emergency} (${((stats.emergency / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  📞 Callback Request: ${stats.callback} (${((stats.callback / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  ℹ️  Clinic Info: ${stats.info} (${((stats.info / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  ⚪ Blank (no badge): ${stats.blank} (${((stats.blank / stats.total) * 100).toFixed(1)}%)`,
  );
  console.log(``);
  console.log(`Update Status:`);
  console.log(`  ${dryRun ? "📝 Would update" : "✅ Updated"}: ${updateCount}`);
  console.log(`  ✓  No change needed: ${noChangeCount}`);
  if (errorCount > 0) {
    console.log(`  ❌ Errors: ${errorCount}`);
  }
  console.log("=".repeat(80));

  if (dryRun) {
    console.log("\n⚠️  DRY RUN MODE - No changes were made to the database");
    console.log("Run without --dry-run to apply these changes");
  } else {
    console.log("\n🎉 Backfill complete!");
  }

  console.log("");
}

// Run the script
backfillToolBasedOutcomes().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

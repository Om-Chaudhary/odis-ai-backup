#!/usr/bin/env npx tsx
/**
 * Clean False Outcomes from Incomplete Inbound Calls
 *
 * Description: Finds inbound calls that have fallback outcomes (Info, Call Back, etc.)
 * but match incomplete call criteria (short duration, no user speech, no-conversation
 * endedReason). Sets outcome to null and removes card_type from structured_data.
 *
 * Usage: pnpm tsx scripts/backfill/backfill-clean-false-outcomes.ts [options]
 *
 * Options:
 *   --dry-run     Show what would happen without making changes
 *   --verbose     Show detailed output
 *   --limit=N     Limit number of records to process
 *   --days=N      Filter to last N days (default: 90)
 *
 * Environment:
 *   SUPABASE_SERVICE_ROLE_KEY - Required for database access
 *
 * Examples:
 *   pnpm tsx scripts/backfill/backfill-clean-false-outcomes.ts --dry-run
 *   pnpm tsx scripts/backfill/backfill-clean-false-outcomes.ts --days=30 --dry-run
 *   pnpm tsx scripts/backfill/backfill-clean-false-outcomes.ts --limit=10 --verbose
 */

import {
  loadScriptEnv,
  parseScriptArgs,
  createScriptSupabaseClient,
  scriptLog,
} from "@odis-ai/shared/script-utils";

loadScriptEnv({ required: ["SUPABASE_SERVICE_ROLE_KEY"] });

const args = parseScriptArgs({
  flags: {},
});

/** Outcomes that are likely false for incomplete calls */
const FALSE_OUTCOMES = ["Info", "info", "Call Back", "callback", "Blank"];

/** Ended reasons that indicate no real conversation */
const NO_CONVERSATION_REASONS = [
  "silence-timed-out",
  "customer-did-not-answer",
  "dial-busy",
  "dial-failed",
  "dial-no-answer",
  "assistant-error",
  "failed-to-connect",
];

const HARD_DURATION_CUTOFF = 15;
const SOFT_DURATION_CUTOFF = 30;

async function main(): Promise<void> {
  scriptLog.header("Clean False Outcomes from Incomplete Inbound Calls");

  const supabase = createScriptSupabaseClient();
  const days = args.days ?? 90;

  if (args.dryRun) {
    scriptLog.dryRun("Running in dry-run mode - no changes will be made");
  }

  scriptLog.info(`Searching last ${days} days for false outcomes...`);

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch calls with potentially false outcomes
  let query = supabase
    .from("inbound_vapi_calls")
    .select(
      "id, vapi_call_id, outcome, duration_seconds, ended_reason, structured_data, transcript",
    )
    .in("outcome", FALSE_OUTCOMES)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (args.limit) {
    query = query.limit(args.limit);
  }

  const { data: calls, error } = await query;

  if (error) {
    scriptLog.error("Failed to fetch calls:", error.message);
    throw error;
  }

  if (!calls || calls.length === 0) {
    scriptLog.info("No calls found matching criteria");
    return;
  }

  scriptLog.info(`Found ${calls.length} calls with potentially false outcomes`);

  let cleaned = 0;
  let skipped = 0;

  for (const call of calls) {
    const duration = call.duration_seconds as number | null;
    const endedReason = call.ended_reason as string | null;
    const transcript = call.transcript as string | null;
    const structuredData = call.structured_data as Record<string, unknown> | null;

    // Check if this call is actually incomplete
    const isNoConversation =
      endedReason &&
      NO_CONVERSATION_REASONS.some((r) =>
        endedReason.toLowerCase().includes(r),
      );
    const isHardCutoff = duration !== null && duration < HARD_DURATION_CUTOFF;
    const hasNoUserSpeech = !transcript || !transcript.match(/^user\s*:/im);
    const isSoftCutoff =
      duration !== null && duration < SOFT_DURATION_CUTOFF && hasNoUserSpeech;

    const shouldClean =
      isNoConversation || isHardCutoff || isSoftCutoff || hasNoUserSpeech;

    if (!shouldClean) {
      skipped++;
      if (args.verbose) {
        scriptLog.debug(
          `Skipping ${call.id} — does not match incomplete criteria (duration=${duration}s, endedReason=${endedReason})`,
        );
      }
      continue;
    }

    if (args.verbose) {
      scriptLog.info(
        `${call.id}: outcome="${call.outcome}" duration=${duration}s endedReason="${endedReason}" reason=${isNoConversation ? "no-conversation" : isHardCutoff ? "hard-cutoff" : isSoftCutoff ? "soft-cutoff" : "no-user-speech"}`,
      );
    }

    // Build sanitized structured data
    let sanitizedData: Record<string, unknown> | null = null;
    if (structuredData) {
      sanitizedData = { ...structuredData };
      delete sanitizedData.card_type;
      delete sanitizedData.callback_data;
      delete sanitizedData.info_data;
      delete sanitizedData.emergency_data;
      if (Object.keys(sanitizedData).length === 0) {
        sanitizedData = null;
      }
    }

    if (args.dryRun) {
      scriptLog.dryRun(
        `Would clean ${call.id}: outcome=${call.outcome} → null, remove card_type from structured_data`,
      );
    } else {
      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update({
          outcome: null,
          structured_data: sanitizedData,
        })
        .eq("id", call.id);

      if (updateError) {
        scriptLog.error(`Failed to update ${call.id}: ${updateError.message}`);
        continue;
      }
    }

    cleaned++;

    if (calls.length > 10) {
      scriptLog.progress(cleaned + skipped, calls.length);
    }
  }

  scriptLog.divider();
  scriptLog.success(`Cleaned: ${cleaned}`);
  if (skipped > 0) {
    scriptLog.warn(`Skipped (not incomplete): ${skipped}`);
  }
  scriptLog.success("Done!");
}

main().catch((error) => {
  scriptLog.error("Script failed:", error);
  process.exit(1);
});

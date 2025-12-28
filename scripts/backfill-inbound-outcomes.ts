/**
 * Backfill Script: Generate Outcomes for Inbound Calls
 *
 * This script analyzes inbound call transcripts using AI to classify outcomes
 * and extract action items.
 *
 * Outcome Categories:
 * - "Scheduled" - Appointment was successfully scheduled
 * - "Cancellation" - Appointment was cancelled or rescheduled
 * - "Info" - Caller was seeking information only
 * - "Emergency" - Urgent/emergency situation
 * - "Call Back" - Caller requested a callback
 * - "Completed" - General completed call (fallback)
 *
 * Usage:
 *   pnpm tsx scripts/backfill-inbound-outcomes.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be updated without making changes
 *   --days=N            Look back N days (default: 365)
 *   --limit=N           Limit to N records (default: no limit)
 *   --force-update      Re-analyze calls that already have outcome (default: skip)
 *   --clinic=NAME       Filter by clinic name
 *
 * Examples:
 *   # Dry run to see what would be analyzed
 *   pnpm tsx scripts/backfill-inbound-outcomes.ts --dry-run --limit=10
 *
 *   # Process all calls
 *   pnpm tsx scripts/backfill-inbound-outcomes.ts
 *
 *   # Process specific clinic
 *   pnpm tsx scripts/backfill-inbound-outcomes.ts --clinic="Alum Rock"
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Load environment variables from .env.local
config({ path: ".env.local" });

// ============================================================================
// TYPES
// ============================================================================

interface InboundCallRecord {
  id: string;
  vapi_call_id: string;
  transcript: string | null;
  summary: string | null;
  clinic_name: string | null;
  status: string;
  created_at: string;
  outcome: string | null;
  actions_taken: string[] | null;
  attention_types: string[] | null;
  attention_severity: string | null;
}

interface OutcomeResult {
  outcome: string;
  actions_taken: string[];
}

interface BackfillStats {
  total: number;
  analyzed: number;
  skipped: number;
  errors: number;
  byOutcome: Record<string, number>;
  errorDetails: Array<{ callId: string; error: string }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OUTCOME_CATEGORIES = [
  "Scheduled",
  "Cancellation",
  "Info",
  "Emergency",
  "Call Back",
  "Completed",
] as const;

type OutcomeCategory = (typeof OUTCOME_CATEGORIES)[number];

// ============================================================================
// AI CLASSIFICATION
// ============================================================================

const CLASSIFICATION_PROMPT = `You are classifying veterinary clinic inbound phone calls.

Given the call summary and/or transcript, classify the call outcome into exactly ONE of these categories:
- "Scheduled" - An appointment was successfully scheduled during the call
- "Cancellation" - An appointment was cancelled or rescheduled
- "Info" - Caller was seeking information only (hours, pricing, directions, general questions, status checks)
- "Emergency" - Urgent/emergency situation requiring immediate attention
- "Call Back" - Caller requested a callback or follow-up call from staff
- "Completed" - General completed call that doesn't fit other categories

Also extract 1-3 brief action items that summarize what happened on the call. These should be clear, actionable statements from the clinic's perspective.

Rules:
1. Choose the MOST specific category that applies
2. "Scheduled" takes priority if an appointment was actually booked
3. "Emergency" takes priority if there's any urgent health concern
4. Action items should be concise (under 10 words each)
5. If the call is short or unclear, default to "Completed"

Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "outcome": "Category",
  "actions_taken": ["Action 1", "Action 2"]
}`;

async function classifyWithLLM(
  anthropic: Anthropic,
  summary: string | null,
  transcript: string | null,
): Promise<OutcomeResult> {
  // Need at least some content to classify
  if (!summary && !transcript) {
    return { outcome: "Completed", actions_taken: [] };
  }

  const content = `Call Summary: ${summary ?? "N/A"}

Call Transcript (excerpt): ${transcript?.slice(0, 3000) ?? "N/A"}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: CLASSIFICATION_PROMPT,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (textBlock?.type !== "text") {
    throw new Error("No text response from AI");
  }

  const jsonText = textBlock.text.trim();
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // Try to extract JSON from potential markdown code block
    const jsonMatch = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(jsonText);
    if (jsonMatch?.[1]) {
      parsed = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error(`Failed to parse AI response as JSON: ${jsonText}`);
    }
  }

  const result = parsed as Record<string, unknown>;

  // Validate outcome
  const outcome = OUTCOME_CATEGORIES.includes(result.outcome as OutcomeCategory)
    ? (result.outcome as OutcomeCategory)
    : "Completed";

  // Validate actions_taken
  const actionsTaken = Array.isArray(result.actions_taken)
    ? (result.actions_taken as string[]).filter(
        (a) => typeof a === "string" && a.length > 0,
      )
    : [];

  return {
    outcome,
    actions_taken: actionsTaken,
  };
}

// ============================================================================
// FAST PATH CLASSIFICATION
// ============================================================================

async function classifyCall(
  supabase: SupabaseClient,
  anthropic: Anthropic,
  call: InboundCallRecord,
): Promise<OutcomeResult> {
  // Fast path 1: Check for emergency from attention flags
  if (
    call.attention_severity === "critical" ||
    call.attention_types?.some((t) =>
      ["emergency", "urgent"].includes(t.toLowerCase()),
    )
  ) {
    return {
      outcome: "Emergency",
      actions_taken: ["Emergency case flagged for immediate attention"],
    };
  }

  // Fast path 2: Check for associated vapi_booking
  const { data: booking } = await supabase
    .from("vapi_bookings")
    .select("status")
    .eq("vapi_call_id", call.vapi_call_id)
    .maybeSingle();

  if (booking?.status === "confirmed") {
    return {
      outcome: "Scheduled",
      actions_taken: ["Appointment scheduled via AI"],
    };
  }
  if (booking?.status === "cancelled" || booking?.status === "rejected") {
    return {
      outcome: "Cancellation",
      actions_taken: ["Appointment cancelled"],
    };
  }

  // Fast path 3: Check for associated clinic_message (callback request)
  const { data: message } = await supabase
    .from("clinic_messages")
    .select("id, priority")
    .eq("vapi_call_id", call.vapi_call_id)
    .maybeSingle();

  if (message) {
    return {
      outcome: "Call Back",
      actions_taken: [
        message.priority === "urgent"
          ? "Urgent callback requested"
          : "Message left for clinic staff",
      ],
    };
  }

  // LLM classification for non-obvious cases
  return await classifyWithLLM(anthropic, call.summary, call.transcript);
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function fetchCallsToProcess(
  supabase: SupabaseClient,
  options: {
    days: number;
    limit: number;
    forceUpdate: boolean;
    clinicName?: string;
  },
): Promise<InboundCallRecord[]> {
  const { days, limit, forceUpdate, clinicName } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from("inbound_vapi_calls")
    .select(
      "id, vapi_call_id, transcript, summary, clinic_name, status, created_at, outcome, actions_taken, attention_types, attention_severity",
    )
    .gte("created_at", startDate.toISOString())
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filter out calls that already have outcome (unless force update)
  if (!forceUpdate) {
    query = query.is("outcome", null);
  }

  // Filter by clinic name if provided
  if (clinicName) {
    query = query.ilike("clinic_name", `%${clinicName}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch calls: ${error.message}`);
  }

  return (data ?? []) as InboundCallRecord[];
}

async function updateCallOutcome(
  supabase: SupabaseClient,
  callId: string,
  result: OutcomeResult,
): Promise<void> {
  const { error } = await supabase
    .from("inbound_vapi_calls")
    .update({
      outcome: result.outcome,
      actions_taken: result.actions_taken,
    })
    .eq("id", callId);

  if (error) {
    throw new Error(`Failed to update call: ${error.message}`);
  }
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillInboundOutcomes(options: {
  dryRun?: boolean;
  days?: number;
  limit?: number;
  forceUpdate?: boolean;
  clinicName?: string;
}): Promise<BackfillStats> {
  const {
    dryRun = false,
    days = 365,
    limit = 10000,
    forceUpdate = false,
    clinicName,
  } = options;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!anthropicApiKey) {
    throw new Error("Missing required environment variable: ANTHROPIC_API_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const stats: BackfillStats = {
    total: 0,
    analyzed: 0,
    skipped: 0,
    errors: 0,
    byOutcome: {},
    errorDetails: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL INBOUND CALL OUTCOMES");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Days to look back: ${days}`);
  console.log(`Limit: ${limit} records`);
  console.log(`Force update existing: ${forceUpdate}`);
  console.log(`Clinic filter: ${clinicName ?? "all"}`);
  console.log("");

  const calls = await fetchCallsToProcess(supabase, {
    days,
    limit,
    forceUpdate,
    clinicName,
  });

  console.log(`Found ${calls.length} calls to process\n`);

  for (const call of calls) {
    stats.total++;

    try {
      const clinicDisplay = call.clinic_name ?? "unknown clinic";
      console.log(
        `[${stats.total}/${calls.length}] ${call.id.slice(0, 8)}... (${clinicDisplay})`,
      );

      const result = await classifyCall(supabase, anthropic, call);

      console.log(`  Outcome: ${result.outcome}`);
      if (result.actions_taken.length > 0) {
        console.log(`  Actions: ${result.actions_taken.join("; ")}`);
      }

      if (!dryRun) {
        await updateCallOutcome(supabase, call.id, result);
        console.log(`  ✅ Updated`);
      } else {
        console.log(`  (DRY RUN - no changes made)`);
      }

      stats.analyzed++;
      stats.byOutcome[result.outcome] =
        (stats.byOutcome[result.outcome] ?? 0) + 1;

      // Rate limiting - 100ms between calls
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      console.error(`  ❌ Error:`, err);
      stats.errors++;
      stats.errorDetails.push({
        callId: call.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return stats;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const forceUpdate = args.includes("--force-update");

  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "365") : 365;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "10000") : 10000;

  const clinicArg = args.find((arg) => arg.startsWith("--clinic="));
  const clinicName = clinicArg ? clinicArg.split("=")[1] : undefined;

  try {
    const stats = await backfillInboundOutcomes({
      dryRun,
      days,
      limit,
      forceUpdate,
      clinicName,
    });

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records processed: ${stats.total}`);
    console.log(`Analyzed: ${stats.analyzed}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (Object.keys(stats.byOutcome).length > 0) {
      console.log("\n📊 By outcome:");
      Object.entries(stats.byOutcome)
        .sort((a, b) => b[1] - a[1])
        .forEach(([outcome, count]) => {
          const pct = ((count / stats.analyzed) * 100).toFixed(1);
          console.log(`  ${outcome}: ${count} (${pct}%)`);
        });
    }

    if (dryRun) {
      console.log("\n⚠️  DRY RUN MODE - No actual changes were made");
      console.log("Run without --dry-run to apply changes");
    } else {
      console.log("\n✅ Backfill complete!");
    }

    if (stats.errorDetails.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("ERROR DETAILS");
      console.log("=".repeat(60));
      stats.errorDetails.slice(0, 10).forEach((detail) => {
        console.log(`  ${detail.callId}: ${detail.error}`);
      });
      if (stats.errorDetails.length > 10) {
        console.log(`  ... and ${stats.errorDetails.length - 10} more errors`);
      }
    }

    process.exit(stats.errors > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Backfill failed:", error);
    process.exit(1);
  }
}

void main();

#!/usr/bin/env tsx

/**
 * AI-Powered Inbound Call Outcome Backfill
 *
 * This script uses Claude AI to intelligently categorize historical inbound calls
 * into the new 4-category outcome pattern by analyzing:
 * 1. Tool calls made during the conversation
 * 2. Transcript content and conversation flow
 * 3. Call metadata (duration, status, etc.)
 *
 * The AI simulates what outcome WOULD have occurred if the call had access to
 * the new tool structure, making intelligent decisions based on conversation intent.
 *
 * Categories:
 * 1. scheduled - Appointment booked/rescheduled/cancelled
 * 2. emergency - Emergency triage situation
 * 3. callback - Client requested callback
 * 4. info - Client got clinic information only
 * 5. null - Call doesn't fit any category (short/failed calls)
 *
 * Usage:
 *   pnpm tsx apps/web/src/scripts/backfill-ai-outcomes.ts [--dry-run] [--since YYYY-MM-DD] [--limit N]
 *
 * Options:
 *   --dry-run       Preview changes without updating database
 *   --since DATE    Only process calls since this date (default: all calls)
 *   --limit N       Only process N calls (for testing)
 *
 * Environment variables required:
 *   - ANTHROPIC_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Types
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface OutcomeAnalysis {
  outcome: "scheduled" | "emergency" | "callback" | "info" | null;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  subcategory?: "schedule" | "reschedule" | "cancel"; // For appointment subcategories
}

interface OutcomeStats {
  scheduled: number;
  emergency: number;
  callback: number;
  info: number;
  blank: number;
  total: number;
  errors: number;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const sinceIndex = args.indexOf("--since");
  const since = sinceIndex !== -1 ? args[sinceIndex + 1] : null;

  const limitIndex = args.indexOf("--limit");
  const limit =
    limitIndex !== -1 ? parseInt(args[limitIndex + 1] ?? "0", 10) : null;

  return { dryRun, since, limit };
}

/**
 * Build readable transcript from messages
 */
function buildTranscript(
  messages: Array<{ role?: string; message?: string; content?: string }>,
): string {
  if (!messages || messages.length === 0) return "";

  return messages
    .filter(
      (msg) =>
        msg.role === "user" || msg.role === "assistant" || msg.role === "bot",
    )
    .map((msg) => {
      const speaker = msg.role === "user" ? "Caller" : "Assistant";
      return `${speaker}: ${msg.message ?? msg.content ?? ""}`;
    })
    .filter((line) => line.trim().length > 5) // Filter out empty lines
    .join("\n");
}

/**
 * Extract tool calls from transcript messages
 */
function extractToolCalls(
  messages: Array<{ toolCalls?: Array<{ function?: { name?: string } }> }>,
): string[] {
  if (!messages || messages.length === 0) return [];

  const toolNames: string[] = [];

  for (const msg of messages) {
    if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
      for (const tc of msg.toolCalls) {
        if (tc.function?.name) {
          toolNames.push(tc.function.name);
        }
      }
    }
  }

  return [...new Set(toolNames)]; // Return unique tool names
}

/**
 * Use Claude AI to analyze call and determine outcome
 */
async function analyzeCallWithAI(
  call: Pick<
    InboundCall,
    | "transcript_messages"
    | "transcript"
    | "duration_seconds"
    | "status"
    | "summary"
  >,
): Promise<OutcomeAnalysis | null> {
  try {
    // Extract data
    const messages =
      (call.transcript_messages as Array<{
        role?: string;
        message?: string;
        content?: string;
        toolCalls?: Array<{ function?: { name?: string } }>;
      }>) ?? [];
    const transcript = call.transcript ?? buildTranscript(messages);
    const toolCalls = extractToolCalls(messages);
    const duration = call.duration_seconds ?? 0;
    const status = call.status;
    const summary = call.summary;

    // If no transcript and very short call, mark as blank
    if (!transcript && duration < 10) {
      return {
        outcome: null,
        confidence: "high",
        reasoning:
          "Very short call with no transcript - likely hangup or wrong number",
      };
    }

    // Build analysis prompt
    const prompt = `You are analyzing a veterinary clinic's inbound phone call to categorize it into ONE of 4 outcome categories.

CALL DATA:
- Status: ${status}
- Duration: ${duration} seconds
- Tools called: ${toolCalls.length > 0 ? toolCalls.join(", ") : "None"}
- Summary: ${summary ?? "No summary"}

TRANSCRIPT:
${transcript || "No transcript available"}

CATEGORIES (choose ONE):

1. **scheduled** - Appointment booking/rescheduling/cancellation
   - Use when: Call involved scheduling, rescheduling, or cancelling an appointment
   - Tool indicators: alum_rock_book_appointment, schedule_appointment, check_availability
   - Conversation indicators: Client books time slot, confirms appointment details, cancels existing appointment
   - Subcategories: "schedule" (new), "reschedule" (change existing), "cancel" (cancellation)

2. **emergency** - Emergency triage
   - Use when: Urgent medical situation requiring immediate attention or ER referral
   - Tool indicators: log_emergency_triage
   - Conversation indicators: Pet having seizures, difficulty breathing, severe trauma, poisoning, etc.

3. **callback** - Client requests callback
   - Use when: Client needs staff to call them back for non-urgent matters
   - Tool indicators: leave_message
   - Conversation indicators: "Can someone call me back?", billing questions, medical records requests, prescription refills

4. **info** - Clinic information only
   - Use when: Client just needed info about hours, location, services, prices, etc.
   - No tools needed
   - Conversation indicators: Asking about hours, directions, services offered, general questions
   - Call completed with duration >30 seconds

5. **null** (blank) - Doesn't fit any category
   - Use when: Very short call (<30s), hangup, wrong number, incomplete conversation
   - No meaningful conversation occurred

CRITICAL RULES:
- If tools were called, prioritize tool evidence over transcript
- Priority order: appointment > emergency > callback > info
- Be conservative: if unclear, choose "info" or null
- Emergency must be TRUE emergency (life-threatening), not just sick pet
- Callback is ONLY for explicit callback requests, not general questions

Respond in JSON format:
{
  "outcome": "scheduled|emergency|callback|info|null",
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of why you chose this outcome",
  "subcategory": "schedule|reschedule|cancel" (only if outcome is "scheduled")
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch =
      /```json\n([\s\S]+?)\n```/.exec(responseText) ??
      /\{[\s\S]+\}/.exec(responseText);

    if (!jsonMatch) {
      console.error(`   ⚠️  No JSON in AI response`);
      return null;
    }

    const jsonText = jsonMatch[1] ?? jsonMatch[0];
    const analysis = JSON.parse(jsonText) as OutcomeAnalysis;

    return analysis;
  } catch (error) {
    console.error(`   ❌ AI analysis error:`, error);
    return null;
  }
}

/**
 * Get human-readable label for outcome
 */
function getOutcomeLabel(outcome: string | null, subcategory?: string): string {
  if (!outcome) return "(blank)";

  const labels: Record<string, string> = {
    scheduled:
      subcategory === "reschedule"
        ? "Reschedule Appointment"
        : subcategory === "cancel"
          ? "Cancel Appointment"
          : "Schedule Appointment",
    emergency: "Emergency Triage",
    callback: "Callback Request",
    info: "Clinic Info",
  };

  return labels[outcome] ?? outcome;
}

/**
 * Main backfill function
 */
async function backfillAIOutcomes() {
  const { dryRun, since, limit } = parseArgs();

  console.log("🤖 Starting AI-powered inbound call outcomes backfill...\n");
  console.log(`Mode: ${dryRun ? "DRY RUN (preview only)" : "LIVE UPDATE"}`);

  if (since) {
    console.log(`Date filter: Processing calls since ${since}`);
  } else {
    console.log("Date filter: Processing ALL calls");
  }

  if (limit) {
    console.log(`Limit: Processing up to ${limit} calls`);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Build query
  let query = supabase
    .from("inbound_vapi_calls")
    .select(
      "id, vapi_call_id, outcome, status, duration_seconds, transcript, transcript_messages, summary, created_at",
    )
    .order("created_at", { ascending: true });

  // Apply filters
  if (since) {
    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      console.error("❌ Invalid date format. Use YYYY-MM-DD");
      process.exit(1);
    }
    query = query.gte("created_at", sinceDate.toISOString());
  }

  if (limit) {
    query = query.limit(limit);
  }

  // Fetch calls
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
    errors: 0,
  };

  let updateCount = 0;
  let noChangeCount = 0;

  // Process each call
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i]!;
    const progress = `[${i + 1}/${calls.length}]`;

    console.log(`${progress} Analyzing: ${call.vapi_call_id}`);
    console.log(`   Created: ${call.created_at}`);
    console.log(`   Current outcome: ${call.outcome ?? "(null)"}`);

    // Analyze with AI
    console.log(`   🤖 AI analyzing...`);
    const analysis = await analyzeCallWithAI(call);

    if (!analysis) {
      console.log(`   ❌ AI analysis failed - skipping`);
      stats.errors++;
      stats.total++;
      continue;
    }

    const newOutcome = analysis.outcome;
    const label = getOutcomeLabel(newOutcome, analysis.subcategory);

    // Update stats
    if (newOutcome === "scheduled") stats.scheduled++;
    else if (newOutcome === "emergency") stats.emergency++;
    else if (newOutcome === "callback") stats.callback++;
    else if (newOutcome === "info") stats.info++;
    else stats.blank++;
    stats.total++;

    // Log result
    console.log(`   ✨ AI Result: ${newOutcome ?? "(null)"} → ${label}`);
    console.log(`   Confidence: ${analysis.confidence}`);
    console.log(`   Reasoning: ${analysis.reasoning}`);

    // Check if update needed
    const needsUpdate = call.outcome !== newOutcome;

    if (needsUpdate && !dryRun) {
      const { error: updateError } = await supabase
        .from("inbound_vapi_calls")
        .update({ outcome: newOutcome })
        .eq("id", call.id);

      if (updateError) {
        console.log(`   ❌ Update failed:`, updateError);
        stats.errors++;
      } else {
        console.log(`   ✅ Updated successfully`);
        updateCount++;
      }
    } else if (needsUpdate && dryRun) {
      console.log(`   📝 Would update (dry run)`);
      updateCount++;
    } else {
      console.log(`   ✓  No change needed`);
      noChangeCount++;
    }

    console.log("");

    // Rate limiting - wait 2 seconds between AI calls
    if (i < calls.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  // Print summary
  console.log("=".repeat(80));
  console.log("\n📊 AI BACKFILL SUMMARY");
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
  if (stats.errors > 0) {
    console.log(`  ❌ Errors: ${stats.errors}`);
  }
  console.log("=".repeat(80));

  if (dryRun) {
    console.log("\n⚠️  DRY RUN MODE - No changes were made to the database");
    console.log("Run without --dry-run to apply these changes");
  } else {
    console.log("\n🎉 AI backfill complete!");
  }

  console.log("");
}

// Run the script
backfillAIOutcomes().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});

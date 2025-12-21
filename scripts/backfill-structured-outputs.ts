/**
 * Backfill Script: Generate Structured Outputs for Historical Calls
 *
 * This script re-analyzes call transcripts using AI to generate structured
 * attention data for calls made before structured outputs were configured in VAPI.
 *
 * It will:
 * - Fetch completed outbound calls with transcripts but missing attention data
 * - Use Claude AI to analyze each transcript
 * - Generate structured outputs: needs_attention, attention_types, attention_severity, attention_summary
 * - Update the database with the generated data
 *
 * Usage:
 *   pnpm tsx scripts/backfill-structured-outputs.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be updated without making changes
 *   --days=N            Look back N days (default: 90)
 *   --limit=N           Limit to N records (default: no limit)
 *   --force-update      Re-analyze calls that already have attention data (default: skip already processed)
 *   --clinic=NAME       Filter by clinic name
 *   --include-inbound   Also process inbound calls (requires attention columns in inbound_vapi_calls)
 *
 * Examples:
 *   # Dry run to see what would be analyzed
 *   pnpm tsx scripts/backfill-structured-outputs.ts --dry-run --days=30
 *
 *   # Process last 30 days, max 50 calls
 *   pnpm tsx scripts/backfill-structured-outputs.ts --days=30 --limit=50
 *
 *   # Process specific clinic
 *   pnpm tsx scripts/backfill-structured-outputs.ts --clinic="Alum Rock"
 *
 *   # Re-analyze everything including existing attention data
 *   pnpm tsx scripts/backfill-structured-outputs.ts --force-update --days=90
 *
 * Note: Inbound calls (inbound_vapi_calls) require attention columns to be added.
 * Run this migration first if you want to include inbound calls:
 *   ALTER TABLE inbound_vapi_calls ADD COLUMN attention_types text[] DEFAULT '{}';
 *   ALTER TABLE inbound_vapi_calls ADD COLUMN attention_severity text;
 *   ALTER TABLE inbound_vapi_calls ADD COLUMN attention_summary text;
 *   ALTER TABLE inbound_vapi_calls ADD COLUMN attention_flagged_at timestamptz;
 */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Load environment variables from .env.local
config({ path: ".env.local" });

// ============================================================================
// TYPES
// ============================================================================

interface CallRecord {
  id: string;
  vapi_call_id: string | null;
  transcript: string | null;
  attention_types: string[] | null;
  attention_severity: string | null;
  attention_summary: string | null;
  status: string;
  created_at: string;
  // For outbound calls
  case_id?: string | null;
  // For inbound calls - direct column
  clinic_name?: string | null;
}

interface StructuredOutput {
  needs_attention: boolean;
  attention_types: string[];
  attention_severity: "routine" | "urgent" | "critical";
  attention_summary: string | null;
}

interface BackfillStats {
  total: number;
  analyzed: number;
  needsAttention: number;
  noAttention: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ callId: string; error: string }>;
  details: Array<{
    callId: string;
    action: "analyzed" | "skip" | "error";
    needsAttention?: boolean;
    attentionTypes?: string[];
    severity?: string;
  }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ATTENTION_TYPES = [
  "health_concern",
  "callback_request",
  "medication_question",
  "appointment_needed",
  "dissatisfaction",
  "billing_question",
  "emergency_signs",
] as const;

const SEVERITY_LEVELS = ["routine", "urgent", "critical"] as const;

// ============================================================================
// AI ANALYSIS
// ============================================================================

const SYSTEM_PROMPT = `You are an expert veterinary call analyst. Your role is to analyze veterinary discharge follow-up call transcripts and identify if the case requires clinic attention.

## Your Task
Analyze the transcript and determine:
1. Whether the case needs clinic attention (needs_attention)
2. What types of attention are needed (attention_types)
3. How urgent the attention is (attention_severity)
4. A brief summary explaining why attention is needed (attention_summary)

## Attention Types (choose all that apply):
- health_concern: Pet is showing concerning symptoms, not improving, or getting worse
- callback_request: Owner explicitly asked for a callback from the clinic
- medication_question: Owner has questions about medications (dosage, side effects, administration)
- appointment_needed: Pet needs a follow-up appointment or the owner wants to schedule one
- dissatisfaction: Owner expressed dissatisfaction with care, service, or treatment
- billing_question: Owner has questions about billing, costs, or payment
- emergency_signs: Pet is showing emergency symptoms requiring immediate care

## Severity Levels:
- routine: Minor questions or concerns that can be addressed at next business opportunity
- urgent: Concerns that should be addressed same-day (pet not improving, moderate symptoms)
- critical: Emergency situations requiring immediate attention (severe symptoms, pet in distress)

## Rules:
1. Be conservative - only flag as needing attention if there's a genuine concern
2. A successful call where the pet is doing well does NOT need attention
3. General questions answered by the AI assistant do NOT need attention
4. Only flag callback_request if the owner EXPLICITLY asked for a call back
5. If the call was cut short or the owner hung up, that alone is NOT a reason to flag

## Output Format:
Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "needs_attention": boolean,
  "attention_types": string[],
  "attention_severity": "routine" | "urgent" | "critical",
  "attention_summary": string | null
}

If needs_attention is false, attention_types should be [], attention_severity should be "routine", and attention_summary should be null.`;

function createUserPrompt(transcript: string): string {
  return `Analyze this veterinary discharge follow-up call transcript and determine if clinic attention is needed:

<transcript>
${transcript}
</transcript>

Respond with ONLY the JSON object, no other text.`;
}

async function analyzeTranscript(
  transcript: string,
  anthropic: Anthropic,
): Promise<StructuredOutput> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: createUserPrompt(transcript),
      },
    ],
    system: SYSTEM_PROMPT,
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (textBlock?.type !== "text") {
    throw new Error("No text response from AI");
  }

  // Parse JSON response
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

  // Validate and normalize response
  const result = parsed as Record<string, unknown>;

  const needsAttention = result.needs_attention === true;
  const attentionTypes = Array.isArray(result.attention_types)
    ? (result.attention_types as string[]).filter((t) =>
        ATTENTION_TYPES.includes(t as (typeof ATTENTION_TYPES)[number]),
      )
    : [];
  const attentionSeverity = SEVERITY_LEVELS.includes(
    result.attention_severity as (typeof SEVERITY_LEVELS)[number],
  )
    ? (result.attention_severity as (typeof SEVERITY_LEVELS)[number])
    : "routine";
  const attentionSummary =
    typeof result.attention_summary === "string"
      ? result.attention_summary
      : null;

  return {
    needs_attention: needsAttention,
    attention_types: needsAttention ? attentionTypes : [],
    attention_severity: needsAttention ? attentionSeverity : "routine",
    attention_summary: needsAttention ? attentionSummary : null,
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function fetchCallsToProcess(
  supabase: SupabaseClient,
  options: {
    table: "scheduled_discharge_calls" | "inbound_vapi_calls";
    days: number;
    limit: number;
    forceUpdate: boolean;
    clinicName?: string;
  },
): Promise<CallRecord[]> {
  const { table, days, limit, forceUpdate, clinicName } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Different select based on table schema
  // For outbound calls: clinic_name is on users table (via cases.user_id), so we skip it
  // For inbound calls: clinic_name is directly on the table
  const selectColumns =
    table === "scheduled_discharge_calls"
      ? "id, vapi_call_id, transcript, attention_types, attention_severity, attention_summary, status, created_at, case_id"
      : "id, vapi_call_id, transcript, attention_types, attention_severity, attention_summary, clinic_name, status, created_at";

  let query = supabase
    .from(table)
    .select(selectColumns)
    .gte("created_at", startDate.toISOString())
    .eq("status", "completed")
    .not("transcript", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filter out calls that already have attention data (unless force update)
  if (!forceUpdate) {
    query = query.or("attention_types.is.null,attention_types.eq.{}");
  }

  // Filter by clinic name if provided (only works for inbound calls)
  if (clinicName && table === "inbound_vapi_calls") {
    query = query.ilike("clinic_name", `%${clinicName}%`);
  } else if (clinicName && table === "scheduled_discharge_calls") {
    console.log(
      "⚠️  Note: --clinic filter not supported for outbound calls (requires complex join)",
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch calls: ${error.message}`);
  }

  // Cast to CallRecord[] since Supabase can't infer the join types
  const calls = (data ?? []) as unknown as CallRecord[];

  // Filter out calls without meaningful conversation
  // Require: at least 500 chars AND multiple speaker turns (AI: and User:)
  return calls.filter((call) => {
    if (!call.transcript) return false;
    const transcript = call.transcript.trim();

    // Must be at least 500 characters (roughly a few sentences of actual conversation)
    if (transcript.length < 500) return false;

    // Must have both AI and user speaking (indicates actual conversation happened)
    const hasAiSpeaker = /\b(AI|Assistant|Agent):/i.test(transcript);
    const hasUserSpeaker = /\b(User|Customer|Client|Human):/i.test(transcript);

    // If no speaker labels, check for reasonable word count (at least 50 words)
    if (!hasAiSpeaker && !hasUserSpeaker) {
      const wordCount = transcript.split(/\s+/).length;
      return wordCount >= 50;
    }

    return hasAiSpeaker && hasUserSpeaker;
  });
}

async function updateCallWithStructuredOutput(
  supabase: SupabaseClient,
  table: "scheduled_discharge_calls" | "inbound_vapi_calls",
  callId: string,
  output: StructuredOutput,
): Promise<void> {
  const updateData: Record<string, unknown> = {
    attention_types: output.attention_types,
    attention_severity: output.attention_severity,
    attention_summary: output.attention_summary,
  };

  // Only set flagged_at if needs attention
  if (output.needs_attention) {
    updateData.attention_flagged_at = new Date().toISOString();
  }

  // Store the structured output in structured_data if it doesn't exist
  // This mimics what VAPI would have stored
  if (output.needs_attention) {
    updateData.structured_data = {
      needs_attention: output.needs_attention,
      attention_types: output.attention_types,
      attention_severity: output.attention_severity,
      attention_summary: output.attention_summary,
      backfilled: true,
      backfilled_at: new Date().toISOString(),
    };
  }

  // Update parent case is_urgent flag for critical cases
  if (
    output.attention_severity === "critical" &&
    table === "scheduled_discharge_calls"
  ) {
    const { data: callData } = await supabase
      .from(table)
      .select("case_id")
      .eq("id", callId)
      .single();

    if (callData?.case_id) {
      await supabase
        .from("cases")
        .update({ is_urgent: true })
        .eq("id", callData.case_id);
    }
  }

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .eq("id", callId);

  if (error) {
    throw new Error(`Failed to update call: ${error.message}`);
  }
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillStructuredOutputs(options: {
  dryRun?: boolean;
  days?: number;
  limit?: number;
  forceUpdate?: boolean;
  clinicName?: string;
  includeInbound?: boolean;
}): Promise<BackfillStats> {
  const {
    dryRun = false,
    days = 90,
    limit = 10000, // Effectively no limit - process all matching calls
    forceUpdate = false,
    clinicName,
    includeInbound = false,
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
    needsAttention: 0,
    noAttention: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
    details: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL STRUCTURED OUTPUTS FOR CALL TRANSCRIPTS");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Days to look back: ${days}`);
  console.log(`Limit: ${limit} records`);
  console.log(`Force update existing: ${forceUpdate}`);
  console.log(`Clinic filter: ${clinicName ?? "all"}`);
  console.log(`Include inbound: ${includeInbound}`);
  console.log("");

  // Process outbound calls
  console.log("📞 Processing outbound calls (scheduled_discharge_calls)...\n");

  const outboundCalls = await fetchCallsToProcess(supabase, {
    table: "scheduled_discharge_calls",
    days,
    limit,
    forceUpdate,
    clinicName,
  });

  console.log(`Found ${outboundCalls.length} outbound calls to process\n`);

  for (const call of outboundCalls) {
    stats.total++;

    try {
      // Double-check transcript (fetchCallsToProcess already filters, but be safe)
      if (!call.transcript || call.transcript.trim().length < 500) {
        console.log(
          `[SKIP] ${call.id}: Transcript too short (${call.transcript?.length ?? 0} chars)`,
        );
        stats.skipped++;
        stats.details.push({
          callId: call.id,
          action: "skip",
        });
        continue;
      }

      console.log(`[ANALYZE] ${call.id}`);
      console.log(`  Transcript length: ${call.transcript.length} chars`);

      if (!dryRun) {
        const output = await analyzeTranscript(call.transcript, anthropic);

        console.log(`  Needs attention: ${output.needs_attention}`);
        if (output.needs_attention) {
          console.log(`  Types: ${output.attention_types.join(", ")}`);
          console.log(`  Severity: ${output.attention_severity}`);
          console.log(
            `  Summary: ${output.attention_summary?.slice(0, 80)}...`,
          );
        }

        await updateCallWithStructuredOutput(
          supabase,
          "scheduled_discharge_calls",
          call.id,
          output,
        );

        console.log(`  ✅ Updated successfully`);

        stats.analyzed++;
        stats.details.push({
          callId: call.id,
          action: "analyzed",
          needsAttention: output.needs_attention,
          attentionTypes: output.attention_types,
          severity: output.attention_severity,
        });

        if (output.needs_attention) {
          stats.needsAttention++;
        } else {
          stats.noAttention++;
        }
      } else {
        console.log(`  (DRY RUN - no changes made)`);
        stats.analyzed++;
        stats.details.push({
          callId: call.id,
          action: "analyzed",
        });
      }

      // Rate limiting - 1 request per second for Anthropic
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`[ERROR] ${call.id}:`, err);
      stats.errors++;
      stats.errorDetails.push({
        callId: call.id,
        error: err instanceof Error ? err.message : String(err),
      });
      stats.details.push({
        callId: call.id,
        action: "error",
      });
    }
  }

  // Process inbound calls if requested
  if (includeInbound) {
    console.log("\n📥 Processing inbound calls (inbound_vapi_calls)...\n");

    let inboundCalls: CallRecord[] = [];
    try {
      inboundCalls = await fetchCallsToProcess(supabase, {
        table: "inbound_vapi_calls",
        days,
        limit: Math.max(0, limit - outboundCalls.length),
        forceUpdate,
        clinicName,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes("column") ||
        errorMessage.includes("does not exist")
      ) {
        console.log(
          "⚠️  Skipping inbound calls - attention columns not found in inbound_vapi_calls",
        );
        console.log(
          "   Run the migration mentioned in the script header to add them.\n",
        );
        return stats;
      }
      throw err;
    }

    console.log(`Found ${inboundCalls.length} inbound calls to process\n`);

    for (const call of inboundCalls) {
      stats.total++;

      try {
        // Double-check transcript (fetchCallsToProcess already filters, but be safe)
        if (!call.transcript || call.transcript.trim().length < 500) {
          console.log(
            `[SKIP] ${call.id}: Transcript too short (${call.transcript?.length ?? 0} chars)`,
          );
          stats.skipped++;
          stats.details.push({
            callId: call.id,
            action: "skip",
          });
          continue;
        }

        const clinicDisplay = call.clinic_name ?? "unknown clinic";
        console.log(`[ANALYZE] ${call.id} (${clinicDisplay})`);
        console.log(`  Transcript length: ${call.transcript.length} chars`);

        if (!dryRun) {
          const output = await analyzeTranscript(call.transcript, anthropic);

          console.log(`  Needs attention: ${output.needs_attention}`);
          if (output.needs_attention) {
            console.log(`  Types: ${output.attention_types.join(", ")}`);
            console.log(`  Severity: ${output.attention_severity}`);
          }

          await updateCallWithStructuredOutput(
            supabase,
            "inbound_vapi_calls",
            call.id,
            output,
          );

          console.log(`  ✅ Updated successfully`);

          stats.analyzed++;
          stats.details.push({
            callId: call.id,
            action: "analyzed",
            needsAttention: output.needs_attention,
            attentionTypes: output.attention_types,
            severity: output.attention_severity,
          });

          if (output.needs_attention) {
            stats.needsAttention++;
          } else {
            stats.noAttention++;
          }
        } else {
          console.log(`  (DRY RUN - no changes made)`);
          stats.analyzed++;
        }

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[ERROR] ${call.id}:`, err);
        stats.errors++;
        stats.errorDetails.push({
          callId: call.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
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
  const includeInbound = args.includes("--include-inbound");

  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "90") : 90;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "10000") : 10000;

  const clinicArg = args.find((arg) => arg.startsWith("--clinic="));
  const clinicName = clinicArg ? clinicArg.split("=")[1] : undefined;

  try {
    const stats = await backfillStructuredOutputs({
      dryRun,
      days,
      limit,
      forceUpdate,
      clinicName,
      includeInbound,
    });

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records processed: ${stats.total}`);
    console.log(`Analyzed: ${stats.analyzed}`);
    console.log(`  - Needs attention: ${stats.needsAttention}`);
    console.log(`  - No attention needed: ${stats.noAttention}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.needsAttention > 0) {
      console.log("\n📊 Attention breakdown:");
      const typeCounts: Record<string, number> = {};
      const severityCounts: Record<string, number> = {};

      stats.details
        .filter((d) => d.needsAttention)
        .forEach((d) => {
          d.attentionTypes?.forEach((t) => {
            typeCounts[t] = (typeCounts[t] ?? 0) + 1;
          });
          if (d.severity) {
            severityCounts[d.severity] = (severityCounts[d.severity] ?? 0) + 1;
          }
        });

      console.log("\n  By type:");
      Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`    ${type}: ${count}`);
        });

      console.log("\n  By severity:");
      Object.entries(severityCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([severity, count]) => {
          console.log(`    ${severity}: ${count}`);
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

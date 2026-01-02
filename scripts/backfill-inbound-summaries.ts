/**
 * Backfill Script: Fetch Call Summaries from VAPI
 *
 * This script fetches missing call summaries from VAPI for inbound calls
 * that have a vapi_call_id but no summary in the database.
 *
 * Usage:
 *   pnpm tsx scripts/backfill-inbound-summaries.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be updated without making changes
 *   --days=N            Look back N days (default: 365)
 *   --limit=N           Limit to N records (default: no limit)
 *   --force-update      Re-fetch calls that already have summary (default: skip)
 *   --clinic=NAME       Filter by clinic name
 *
 * Examples:
 *   # Dry run to see what would be fetched
 *   pnpm tsx scripts/backfill-inbound-summaries.ts --dry-run --limit=10
 *
 *   # Process all calls missing summaries
 *   pnpm tsx scripts/backfill-inbound-summaries.ts
 *
 *   # Process specific clinic
 *   pnpm tsx scripts/backfill-inbound-summaries.ts --clinic="Alum Rock"
 */

import { config } from "dotenv";

// Load environment variables from .env.local BEFORE any other imports
config({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { VapiClient } from "@vapi-ai/server-sdk";
import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// TYPES
// ============================================================================

interface InboundCallRecord {
  id: string;
  vapi_call_id: string;
  clinic_name: string | null;
  status: string;
  created_at: string;
  summary: string | null;
  transcript: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
}

interface BackfillStats {
  total: number;
  fetched: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ callId: string; error: string }>;
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
      "id, vapi_call_id, clinic_name, status, created_at, summary, transcript, recording_url, duration_seconds",
    )
    .gte("created_at", startDate.toISOString())
    // Include completed, ringing (may have transcripts from incomplete status updates), and in_progress
    .in("status", ["completed", "ringing", "in_progress"])
    .not("vapi_call_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Filter out calls that already have summary (unless force update)
  if (!forceUpdate) {
    query = query.is("summary", null);
    // Prioritize calls that have transcripts (we can generate summaries for them)
    query = query.not("transcript", "is", null);
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

async function updateCallSummary(
  supabase: SupabaseClient,
  callId: string,
  data: {
    summary: string | null;
    transcript?: string | null;
    recording_url?: string | null;
    duration_seconds?: number | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("inbound_vapi_calls")
    .update(data)
    .eq("id", callId);

  if (error) {
    throw new Error(`Failed to update call: ${error.message}`);
  }
}

// ============================================================================
// AI SUMMARY GENERATION
// ============================================================================

const SUMMARY_PROMPT = `You are summarizing veterinary clinic phone calls. Generate a concise 1-2 sentence summary of this call that captures:
- The main purpose/reason for the call
- The outcome or resolution
- Any important details (pet name, appointment scheduled, etc.)

Keep the summary professional and factual. Do not include greetings or filler.

Respond with ONLY the summary text, no quotes or formatting.`;

async function generateSummaryWithAI(
  anthropic: Anthropic,
  transcript: string,
): Promise<string | null> {
  if (!transcript || transcript.trim().length < 50) {
    return null; // Too short to summarize meaningfully
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SUMMARY_PROMPT,
      messages: [
        {
          role: "user",
          content: `Call transcript:\n\n${transcript.slice(0, 4000)}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (textBlock?.type === "text") {
      return textBlock.text.trim();
    }
    return null;
  } catch (error) {
    console.error(
      `  ⚠️  AI summary generation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

// ============================================================================
// VAPI FETCHING
// ============================================================================

async function fetchCallDataFromVAPI(
  vapiClient: VapiClient,
  vapiCallId: string,
): Promise<{
  summary: string | null;
  transcript: string | null;
  recordingUrl: string | null;
  duration: number | null;
  fromVAPI: boolean;
}> {
  try {
    const callData = await vapiClient.calls.get(vapiCallId);

    const duration =
      callData.endedAt && callData.startedAt
        ? Math.floor(
            (new Date(callData.endedAt).getTime() -
              new Date(callData.startedAt).getTime()) /
              1000,
          )
        : null;

    return {
      summary: callData.analysis?.summary ?? null,
      transcript: callData.transcript ?? null,
      recordingUrl: callData.recordingUrl ?? null,
      duration,
      fromVAPI: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If it's a retention window error, return null values so we can try AI generation
    if (errorMessage.includes("retention window")) {
      return {
        summary: null,
        transcript: null,
        recordingUrl: null,
        duration: null,
        fromVAPI: false,
      };
    }

    throw new Error(`Failed to fetch from VAPI: ${errorMessage}`);
  }
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillInboundSummaries(options: {
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
  const vapiApiKey = process.env.VAPI_PRIVATE_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!vapiApiKey) {
    throw new Error("Missing required environment variable: VAPI_PRIVATE_KEY");
  }

  if (!anthropicApiKey) {
    throw new Error("Missing required environment variable: ANTHROPIC_API_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const vapiClient = new VapiClient({ token: vapiApiKey });
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const stats: BackfillStats = {
    total: 0,
    fetched: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL INBOUND CALL SUMMARIES FROM VAPI");
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

      // Try to fetch data from VAPI first
      const vapiData = await fetchCallDataFromVAPI(
        vapiClient,
        call.vapi_call_id,
      );

      let summary: string | null = vapiData.summary;
      let summarySource = "vapi";

      // If VAPI doesn't have a summary, try to generate one with AI
      if (!summary) {
        // Use transcript from VAPI if available, otherwise use existing DB transcript
        const transcriptToUse = vapiData.transcript ?? call.transcript;

        if (transcriptToUse) {
          console.log(`  🤖 Generating summary with AI...`);
          summary = await generateSummaryWithAI(anthropic, transcriptToUse);
          summarySource = "ai";
        }
      }

      if (summary) {
        console.log(
          `  Summary (${summarySource}): ${summary.slice(0, 100)}${summary.length > 100 ? "..." : ""}`,
        );
      } else {
        console.log(`  ⚠️  No summary available (no transcript to analyze)`);
      }

      // Prepare update data - only include fields that have values
      const updateData: Parameters<typeof updateCallSummary>[2] = {
        summary: summary,
      };

      // Also update transcript, recording_url, and duration if missing in DB (only from VAPI)
      if (vapiData.fromVAPI) {
        if (vapiData.transcript && !call.transcript) {
          updateData.transcript = vapiData.transcript;
          console.log(`  + Also updating transcript`);
        }
        if (vapiData.recordingUrl && !call.recording_url) {
          updateData.recording_url = vapiData.recordingUrl;
          console.log(`  + Also updating recording URL`);
        }
        if (vapiData.duration && !call.duration_seconds) {
          updateData.duration_seconds = vapiData.duration;
          console.log(`  + Also updating duration`);
        }
      }

      if (!dryRun) {
        await updateCallSummary(supabase, call.id, updateData);
        console.log(`  ✅ Updated`);
      } else {
        console.log(`  (DRY RUN - no changes made)`);
      }

      stats.fetched++;

      // Rate limiting - 500ms between calls to avoid VAPI rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`  ❌ Error:`, err);
      stats.errors++;
      stats.errorDetails.push({
        callId: call.id,
        error: err instanceof Error ? err.message : String(err),
      });

      // Handle specific error types
      if (err instanceof Error) {
        const isRateLimit =
          err.message.toLowerCase().includes("rate limit") ||
          err.message.includes("429") ||
          err.message.includes("Rate limit exceeded");

        if (isRateLimit) {
          console.log(`  ⏳ Rate limited, waiting 30 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 30000));
        }
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

  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "365") : 365;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "10000") : 10000;

  const clinicArg = args.find((arg) => arg.startsWith("--clinic="));
  const clinicName = clinicArg ? clinicArg.split("=")[1] : undefined;

  try {
    const stats = await backfillInboundSummaries({
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
    console.log(`Fetched from VAPI: ${stats.fetched}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

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

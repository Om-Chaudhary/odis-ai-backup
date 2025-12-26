/**
 * Backfill Script: Clean Inbound Call Transcripts
 *
 * This script uses AI to clean up speech-to-text transcription errors
 * for inbound calls that have a transcript but no cleaned_transcript.
 *
 * It will:
 * - Fetch inbound calls with transcripts but missing cleaned_transcript
 * - Use the cleanTranscript AI function to fix transcription errors
 * - Update the cleaned_transcript column in the database
 *
 * Usage:
 *   pnpm tsx scripts/backfill-inbound-transcripts.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be updated without making changes
 *   --days=N            Look back N days (default: 30)
 *   --limit=N           Limit to N records (default: 100)
 *   --force-update      Re-clean calls that already have cleaned_transcript
 *
 * Examples:
 *   # Dry run to see what would be cleaned
 *   pnpm tsx scripts/backfill-inbound-transcripts.ts --dry-run
 *
 *   # Process last 30 days, max 50 calls
 *   pnpm tsx scripts/backfill-inbound-transcripts.ts --days=30 --limit=50
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
  vapi_call_id: string | null;
  transcript: string | null;
  cleaned_transcript: string | null;
  clinic_name: string | null;
  created_at: string;
}

interface BackfillStats {
  total: number;
  cleaned: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ callId: string; error: string }>;
}

// ============================================================================
// TRANSCRIPT CLEANING PROMPT
// ============================================================================

const COMMON_CORRECTIONS = `
## Vapi/Deepgram Transcription Errors

### Phonetic Mishearings
- "odis" or "oh dis" → "ODIS" (our company name)
- "vee eye pee" or "v i p" → "V.I.P."
- "alam rock" / "alumrock" / "allamrock" → "Alum Rock" (hospital name)
- "dogtor" → "doctor"

### Filler Words & Speech Disfluencies (REMOVE)
- "um", "uh", "er", "ah" → remove
- "like" (when used as filler, not comparison) → remove
- "you know", "I mean", "so basically" → remove when meaningless
- "gonna" → "going to"
- "wanna" → "want to"
- "kinda" → "kind of"
- "gotta" → "got to"

### Repetitions & False Starts
- "I I want" → "I want"
- "Can you-- Can you help" → "Can you help"
- "We we we have" → "We have"

### Veterinary Medical Terms (Correct Spellings)
- "sub q" / "subq" → "subcutaneous"
- "newter" / "nuter" → "neuter"
- "spey" / "spade" → "spay"
- "parvo" not "parbow" or "par vo"
- "bordatella" / "bordetela" → "Bordetella"

### Common Medication Names
- "metronidazole" not "metro nida zole"
- "gabapentin" not "gaba pentin"
- "apoquel" not "apo kwell"
- "rimadyl" not "rima dill"
- "trazodone" not "trazo done"

### Pet Breed Corrections
- "pit" / "pitt" → "Pit Bull" or "Pitbull"
- "shih tzu" not "shitzu"
- "chihuahua" not "chi wawa"
- "dachshund" not "dash hound"
- "rottweiler" not "rot wiler"
- "german shepherd" not "german shepard"
`;

const SYSTEM_PROMPT = `You are an expert transcript editor specializing in veterinary clinic phone calls transcribed by Vapi/Deepgram. Your task is to clean up speech-to-text transcription errors while preserving the exact meaning and flow of the conversation.

${COMMON_CORRECTIONS}

## Editing Guidelines

### DO:
1. Fix phonetic mishearings and misspellings (especially proper nouns, medical terms, medications)
2. Remove excessive filler words (um, uh, like, you know) that add no meaning
3. Fix word repetitions and false starts ("I I want" → "I want")
4. Correct veterinary terminology to proper medical spellings
5. Preserve speaker labels EXACTLY as provided (AI:, User:, Assistant:, etc.)
6. Maintain natural conversational tone - keep appropriate contractions
7. Keep "[inaudible]" and "[crosstalk]" markers as-is
8. If a clinic name is provided, correct any phonetic misspellings of that name
9. Preserve the COMPLETE transcript - every meaningful exchange

### DO NOT:
1. Change the meaning or intent of what was said
2. Add information that wasn't in the original
3. Summarize or shorten the conversation
4. Remove meaningful pauses indicated by "..." 
5. Change speaker attribution
6. Over-correct casual speech that's grammatically correct
7. Remove emotional expressions or emphasis

### Output Format
Output ONLY the cleaned transcript text. No explanations, headers, or JSON wrapping.`;

// ============================================================================
// AI TRANSCRIPT CLEANING
// ============================================================================

async function cleanTranscript(
  transcript: string,
  clinicName: string | null,
  anthropic: Anthropic,
): Promise<string> {
  let userPrompt = "";

  if (clinicName) {
    userPrompt += `Clinic Context: This call is for "${clinicName}". Correct any misspellings of this clinic name.\n\n`;
  }

  userPrompt += `Clean up this transcript:\n\n${transcript}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (textBlock?.type !== "text") {
    throw new Error("No text response from AI");
  }

  return textBlock.text.trim();
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function fetchCallsToClean(
  supabase: SupabaseClient,
  options: {
    days: number;
    limit: number;
    forceUpdate: boolean;
  },
): Promise<InboundCallRecord[]> {
  const { days, limit, forceUpdate } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabase
    .from("inbound_vapi_calls")
    .select(
      "id, vapi_call_id, transcript, cleaned_transcript, clinic_name, created_at",
    )
    .gte("created_at", startDate.toISOString())
    .not("transcript", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Only get calls without cleaned_transcript (unless force update)
  if (!forceUpdate) {
    query = query.is("cleaned_transcript", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch calls: ${error.message}`);
  }

  // Filter out calls with very short transcripts (not enough to clean)
  return ((data ?? []) as InboundCallRecord[]).filter((call) => {
    if (!call.transcript) return false;
    const transcript = String(call.transcript).trim();
    // Must be at least 100 characters
    return transcript.length >= 100;
  });
}

async function updateCleanedTranscript(
  supabase: SupabaseClient,
  callId: string,
  cleanedTranscript: string,
): Promise<void> {
  const { error } = await supabase
    .from("inbound_vapi_calls")
    .update({ cleaned_transcript: cleanedTranscript })
    .eq("id", callId);

  if (error) {
    throw new Error(`Failed to update call: ${error.message}`);
  }
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillTranscripts(options: {
  dryRun?: boolean;
  days?: number;
  limit?: number;
  forceUpdate?: boolean;
}): Promise<BackfillStats> {
  const {
    dryRun = false,
    days = 30,
    limit = 100,
    forceUpdate = false,
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
    cleaned: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL INBOUND CALL TRANSCRIPTS");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Days to look back: ${days}`);
  console.log(`Limit: ${limit} records`);
  console.log(`Force update existing: ${forceUpdate}`);
  console.log("");

  const calls = await fetchCallsToClean(supabase, {
    days,
    limit,
    forceUpdate,
  });

  console.log(`Found ${calls.length} calls to process\n`);
  stats.total = calls.length;

  for (const call of calls) {
    try {
      if (!call.transcript || call.transcript.trim().length < 100) {
        console.log(
          `[SKIP] ${call.id}: Transcript too short (${call.transcript?.length ?? 0} chars)`,
        );
        stats.skipped++;
        continue;
      }

      const clinicDisplay = call.clinic_name ?? "unknown clinic";
      console.log(`[CLEAN] ${call.id} (${clinicDisplay})`);
      console.log(`  Original length: ${call.transcript.length} chars`);

      if (!dryRun) {
        const cleanedTranscript = await cleanTranscript(
          call.transcript,
          call.clinic_name,
          anthropic,
        );

        console.log(`  Cleaned length: ${cleanedTranscript.length} chars`);

        await updateCleanedTranscript(supabase, call.id, cleanedTranscript);
        console.log(`  ✅ Updated successfully`);

        stats.cleaned++;
      } else {
        console.log(`  (DRY RUN - no changes made)`);
        stats.cleaned++;
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
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "30") : 30;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "100") : 100;

  try {
    const stats = await backfillTranscripts({
      dryRun,
      days,
      limit,
      forceUpdate,
    });

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total records found: ${stats.total}`);
    console.log(`Cleaned: ${stats.cleaned}`);
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

/**
 * Backfill Script: Prepare Cases for Discharge Scheduling
 *
 * This comprehensive script prepares cases for discharge scheduling by:
 * 1. Extracting entities from raw IDEXX consultation notes (if missing)
 * 2. Generating structured discharge summaries
 * 3. Validating contact info for scheduling readiness
 *
 * After running, cases will be ready to schedule via the dashboard.
 *
 * Requirements:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 * - ANTHROPIC_API_KEY env var for AI generation
 *
 * Usage:
 *   pnpm tsx scripts/backfill-discharge-summaries.ts [options]
 *
 * Options:
 *   --dry-run           Show what would be processed without making changes
 *   --days=N            Look back N days (default: 30)
 *   --limit=N           Limit to N records (default: 100)
 *   --user=UUID         Filter by specific user ID
 *   --source=SOURCE     Filter by case source (e.g., idexx_extension, manual)
 *   --force-extract     Re-extract entities even if entity_extraction exists
 *
 * Examples:
 *   # Dry run to see what would be processed
 *   pnpm tsx scripts/backfill-discharge-summaries.ts --dry-run --days=7
 *
 *   # Process last 7 days, max 50 cases
 *   pnpm tsx scripts/backfill-discharge-summaries.ts --days=7 --limit=50
 *
 *   # Process all IDEXX extension cases from last 30 days
 *   pnpm tsx scripts/backfill-discharge-summaries.ts --source=idexx_extension --days=30
 *
 *   # Force re-extraction of entities
 *   pnpm tsx scripts/backfill-discharge-summaries.ts --force-extract --days=7
 */

/* eslint-disable @nx/enforce-module-boundaries */

import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedEntities } from "@odis-ai/shared/validators";

// Load environment variables from .env.local
config({ path: ".env.local" });

// ============================================================================
// TYPES
// ============================================================================

interface CaseRecord {
  id: string;
  user_id: string;
  source: string | null;
  created_at: string;
  entity_extraction: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  patient_name: string | null;
  owner_phone: string | null;
  owner_email: string | null;
  has_discharge_summary: boolean;
}

interface BackfillStats {
  total: number;
  entitiesExtracted: number;
  summariesGenerated: number;
  readyForScheduling: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ caseId: string; patientName: string; error: string }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract raw IDEXX consultation notes from case metadata
 */
function extractRawIdexxNotes(
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null;

  const idexx = metadata.idexx as Record<string, unknown> | undefined;
  if (!idexx) return null;

  // Try metadata.idexx.raw.consultation_notes first
  const raw = idexx.raw as Record<string, unknown> | undefined;
  const rawNotes = raw?.consultation_notes as string | undefined;
  if (rawNotes && rawNotes.length > 30) {
    return rawNotes;
  }

  // Try metadata.idexx.consultation_notes
  const directNotes = idexx.consultation_notes as string | undefined;
  if (directNotes && directNotes.length > 30) {
    return directNotes;
  }

  // Try metadata.idexx.notes
  const notes = idexx.notes as string | undefined;
  if (notes && notes.length > 30) {
    return notes;
  }

  return null;
}

/**
 * Check if entity_extraction has meaningful clinical data
 */
function hasGoodEntityData(entities: Record<string, unknown> | null): boolean {
  if (!entities) return false;

  const clinical = entities.clinical as Record<string, unknown> | undefined;
  if (!clinical) return false;

  // Check for any meaningful clinical data
  const hasDiagnoses = Boolean((clinical.diagnoses as unknown[])?.length);
  const hasChiefComplaint = Boolean(clinical.chiefComplaint);
  const hasVisitReason = Boolean(clinical.visitReason);
  const hasTreatments = Boolean((clinical.treatments as unknown[])?.length);
  const hasVaccinations = Boolean((clinical.vaccinations as unknown[])?.length);
  const hasMedications = Boolean((clinical.medications as unknown[])?.length);
  const hasProcedures = Boolean((clinical.procedures as unknown[])?.length);
  const hasClinicalNotes = Boolean(clinical.clinicalNotes);
  const hasFollowUp = Boolean(clinical.followUpInstructions);

  return (
    hasDiagnoses ||
    hasChiefComplaint ||
    hasVisitReason ||
    hasTreatments ||
    hasVaccinations ||
    hasMedications ||
    hasProcedures ||
    hasClinicalNotes ||
    hasFollowUp
  );
}

/**
 * Strip HTML tags from consultation notes
 */
function cleanHtmlNotes(notes: string): string {
  return notes
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

async function fetchCasesToProcess(
  supabase: SupabaseClient,
  options: {
    days: number;
    limit: number;
    userId?: string;
    source?: string;
    forceExtract?: boolean;
  },
): Promise<CaseRecord[]> {
  const { days, limit, userId, source } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query cases with metadata (for raw notes) that need processing
  let query = supabase
    .from("cases")
    .select(
      `
      id,
      user_id,
      source,
      created_at,
      entity_extraction,
      metadata,
      patients!inner(name, owner_phone, owner_email),
      discharge_summaries(id)
    `,
    )
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (source) {
    query = query.eq("source", source);
  }

  const { data: cases, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }

  if (!cases || cases.length === 0) {
    return [];
  }

  // Transform results
  return cases.map((c) => {
    const patient = Array.isArray(c.patients) ? c.patients[0] : c.patients;
    const summaries = c.discharge_summaries as unknown[];

    return {
      id: c.id,
      user_id: c.user_id,
      source: c.source,
      created_at: c.created_at,
      entity_extraction: c.entity_extraction as Record<string, unknown> | null,
      metadata: c.metadata as Record<string, unknown> | null,
      patient_name: (patient as { name?: string })?.name ?? null,
      owner_phone: (patient as { owner_phone?: string })?.owner_phone ?? null,
      owner_email: (patient as { owner_email?: string })?.owner_email ?? null,
      has_discharge_summary: summaries && summaries.length > 0,
    };
  });
}

// ============================================================================
// AI OPERATIONS
// ============================================================================

/**
 * Extract entities from raw consultation notes using AI
 * Uses the same approach as CasesService.extractEntitiesFromIdexx
 */
async function extractEntitiesFromNotes(
  rawNotes: string,
  metadata: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  // Clean HTML tags
  const cleanedText = rawNotes
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanedText.length < 50) {
    console.log(
      `  ⚠️  Consultation notes too short (${cleanedText.length} chars)`,
    );
    return null;
  }

  // Check for euthanasia (block these cases)
  const isEuthanasia =
    cleanedText.toLowerCase().includes("euthanasia") ||
    cleanedText.toLowerCase().includes("euthanize");

  if (isEuthanasia) {
    console.log(`  ⚠️  Euthanasia case detected - skipping`);
    return null;
  }

  // Dynamic import
  const { extractEntitiesWithRetry } = await import("@odis-ai/integrations/ai");

  const entities = await extractEntitiesWithRetry(
    cleanedText,
    "idexx_consultation_notes",
  );

  // Enrich with IDEXX metadata
  const idexx = metadata?.idexx as Record<string, unknown> | undefined;
  const raw = idexx?.raw as Record<string, unknown> | undefined;

  if (raw?.pet_name) {
    (entities as { patient: { name?: string } }).patient.name =
      raw.pet_name as string;
  }
  if (raw?.owner_name) {
    (entities as { patient: { owner: { name?: string } } }).patient.owner.name =
      raw.owner_name as string;
  }
  if (raw?.phone_number) {
    (
      entities as { patient: { owner: { phone?: string } } }
    ).patient.owner.phone = raw.phone_number as string;
  }
  if (raw?.email) {
    (
      entities as { patient: { owner: { email?: string } } }
    ).patient.owner.email = raw.email as string;
  }

  return entities as unknown as Record<string, unknown>;
}

/**
 * Generate discharge summary from entities or notes
 */
async function generateDischargeSummary(
  entities: Record<string, unknown> | null,
  soapContent: string | null,
  patientData: {
    name?: string;
    species?: string;
    breed?: string;
    owner_name?: string;
  },
): Promise<{ structured: unknown; plainText: string }> {
  const { generateStructuredDischargeSummaryWithRetry } =
    await import("@odis-ai/integrations/ai");

  return generateStructuredDischargeSummaryWithRetry({
    entityExtraction: entities as NormalizedEntities | undefined,
    soapContent: soapContent ?? undefined,
    patientData,
  });
}

// ============================================================================
// MAIN PROCESSING
// ============================================================================

async function processCase(
  supabase: SupabaseClient,
  caseRecord: CaseRecord,
  options: { dryRun: boolean; forceExtract: boolean },
): Promise<{
  entitiesExtracted: boolean;
  summaryGenerated: boolean;
  readyForScheduling: boolean;
  skipped: boolean;
  error?: string;
}> {
  const { dryRun, forceExtract } = options;

  // Check for raw IDEXX notes
  const rawNotes = extractRawIdexxNotes(caseRecord.metadata);

  // Step 1: Check if we need to extract entities
  const needsEntityExtraction =
    forceExtract ||
    !caseRecord.entity_extraction ||
    !hasGoodEntityData(caseRecord.entity_extraction);

  let entities = caseRecord.entity_extraction;
  let entitiesExtracted = false;

  if (needsEntityExtraction && rawNotes && rawNotes.length > 50) {
    console.log(`  📊 Extracting entities from consultation notes...`);

    if (!dryRun) {
      try {
        entities = await extractEntitiesFromNotes(
          rawNotes,
          caseRecord.metadata,
        );

        // Save extracted entities to the case
        const { error: updateError } = await supabase
          .from("cases")
          .update({ entity_extraction: entities })
          .eq("id", caseRecord.id);

        if (updateError) {
          console.warn(`  ⚠️  Failed to save entities: ${updateError.message}`);
        } else {
          entitiesExtracted = true;
          console.log(`  ✅ Entities extracted and saved`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`  ⚠️  Entity extraction failed: ${errorMsg}`);
        // Continue anyway - we might still be able to generate from raw notes
      }
    } else {
      entitiesExtracted = true;
      console.log(`  📊 Would extract entities (DRY RUN)`);
    }
  }

  // Step 2: Check if we need to generate discharge summary
  const needsSummary = !caseRecord.has_discharge_summary;
  let summaryGenerated = false;

  if (needsSummary) {
    // Check if we have enough data to generate
    const hasGoodEntities = hasGoodEntityData(entities);
    const hasRawNotes = rawNotes && rawNotes.length > 50;

    if (!hasGoodEntities && !hasRawNotes) {
      console.log(`  ⏭️  Skipping: No clinical data available`);
      return {
        entitiesExtracted,
        summaryGenerated: false,
        readyForScheduling: false,
        skipped: true,
      };
    }

    console.log(`  📝 Generating discharge summary...`);

    if (!dryRun) {
      try {
        // Extract patient data
        const patientFromEntities = entities?.patient as
          | Record<string, unknown>
          | undefined;
        const idexx = caseRecord.metadata?.idexx as
          | Record<string, unknown>
          | undefined;
        const raw = idexx?.raw as Record<string, unknown> | undefined;

        const patientData = {
          name:
            (patientFromEntities?.name as string) ??
            (raw?.pet_name as string) ??
            caseRecord.patient_name ??
            undefined,
          species: patientFromEntities?.species as string | undefined,
          breed: patientFromEntities?.breed as string | undefined,
          owner_name:
            ((patientFromEntities?.owner as Record<string, unknown>)?.name as
              | string
              | undefined) ?? (raw?.owner_name as string | undefined),
        };

        // Generate summary - use cleaned notes for direct AI generation
        const soapContent =
          !hasGoodEntities && rawNotes ? cleanHtmlNotes(rawNotes) : null;
        const { structured, plainText } = await generateDischargeSummary(
          hasGoodEntities ? entities : null,
          soapContent,
          patientData,
        );

        // Save to database
        const { error: insertError } = await supabase
          .from("discharge_summaries")
          .insert({
            case_id: caseRecord.id,
            user_id: caseRecord.user_id,
            content: plainText,
            structured_content: structured,
          });

        if (insertError) {
          throw new Error(`Failed to save summary: ${insertError.message}`);
        }

        summaryGenerated = true;
        console.log(`  ✅ Discharge summary generated`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          entitiesExtracted,
          summaryGenerated: false,
          readyForScheduling: false,
          skipped: false,
          error: `Summary generation failed: ${errorMsg}`,
        };
      }
    } else {
      summaryGenerated = true;
      console.log(`  📝 Would generate discharge summary (DRY RUN)`);
    }
  } else {
    console.log(`  ✅ Already has discharge summary`);
  }

  // Step 3: Check scheduling readiness
  const hasContactInfo =
    Boolean(caseRecord.owner_phone) || Boolean(caseRecord.owner_email);
  const hasSummary = caseRecord.has_discharge_summary || summaryGenerated;
  const readyForScheduling = hasContactInfo && hasSummary;

  if (readyForScheduling) {
    console.log(
      `  🚀 Ready for scheduling (phone: ${caseRecord.owner_phone ? "✓" : "✗"}, email: ${caseRecord.owner_email ? "✓" : "✗"})`,
    );
  } else if (!hasContactInfo) {
    console.log(`  ⚠️  Missing contact info - cannot schedule`);
  }

  return {
    entitiesExtracted,
    summaryGenerated,
    readyForScheduling,
    skipped: false,
  };
}

// ============================================================================
// MAIN BACKFILL FUNCTION
// ============================================================================

async function backfillCases(options: {
  dryRun?: boolean;
  days?: number;
  limit?: number;
  userId?: string;
  source?: string;
  forceExtract?: boolean;
}): Promise<BackfillStats> {
  const {
    dryRun = false,
    days = 30,
    limit = 100,
    userId,
    source,
    forceExtract = false,
  } = options;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("Missing required environment variable: ANTHROPIC_API_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const stats: BackfillStats = {
    total: 0,
    entitiesExtracted: 0,
    summariesGenerated: 0,
    readyForScheduling: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  console.log("\n" + "=".repeat(60));
  console.log("BACKFILL CASES FOR DISCHARGE SCHEDULING");
  console.log("=".repeat(60));
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Days to look back: ${days}`);
  console.log(`Limit: ${limit} records`);
  console.log(`User filter: ${userId ?? "all"}`);
  console.log(`Source filter: ${source ?? "all"}`);
  console.log(`Force entity extraction: ${forceExtract}`);
  console.log("");

  // Fetch cases to process
  console.log("📋 Fetching cases to process...\n");

  const cases = await fetchCasesToProcess(supabase, {
    days,
    limit,
    userId,
    source,
    forceExtract,
  });

  // Filter to cases that need work
  const casesToProcess = cases.filter((c) => {
    const needsEntities =
      forceExtract ||
      !c.entity_extraction ||
      !hasGoodEntityData(c.entity_extraction);
    const needsSummary = !c.has_discharge_summary;
    const hasRawNotes = Boolean(extractRawIdexxNotes(c.metadata));

    // Process if: needs summary OR (needs entities AND has raw notes)
    return needsSummary || (needsEntities && hasRawNotes);
  });

  console.log(
    `Found ${cases.length} total cases, ${casesToProcess.length} need processing\n`,
  );

  if (casesToProcess.length === 0) {
    console.log("✅ All cases are already up to date.");
    return stats;
  }

  // Process each case
  for (const caseRecord of casesToProcess) {
    stats.total++;

    const patientName = caseRecord.patient_name ?? "Unknown";
    console.log(
      `\n[${stats.total}/${casesToProcess.length}] Case ${caseRecord.id.substring(0, 8)}... (${patientName})`,
    );

    const result = await processCase(supabase, caseRecord, {
      dryRun,
      forceExtract,
    });

    if (result.error) {
      console.error(`  ❌ Error: ${result.error}`);
      stats.errors++;
      stats.errorDetails.push({
        caseId: caseRecord.id,
        patientName,
        error: result.error,
      });
    }

    if (result.entitiesExtracted) stats.entitiesExtracted++;
    if (result.summaryGenerated) stats.summariesGenerated++;
    if (result.readyForScheduling) stats.readyForScheduling++;
    if (result.skipped) stats.skipped++;

    // Rate limiting between AI calls
    if (!dryRun && (result.entitiesExtracted || result.summaryGenerated)) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
  const forceExtract = args.includes("--force-extract");

  const daysArg = args.find((arg) => arg.startsWith("--days="));
  const days = daysArg ? parseInt(daysArg.split("=")[1] ?? "30") : 30;

  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] ?? "100") : 100;

  const userArg = args.find((arg) => arg.startsWith("--user="));
  const userId = userArg ? userArg.split("=")[1] : undefined;

  const sourceArg = args.find((arg) => arg.startsWith("--source="));
  const source = sourceArg ? sourceArg.split("=")[1] : undefined;

  try {
    const stats = await backfillCases({
      dryRun,
      days,
      limit,
      userId,
      source,
      forceExtract,
    });

    console.log("\n" + "=".repeat(60));
    console.log("BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total cases processed: ${stats.total}`);
    console.log(`Entities extracted: ${stats.entitiesExtracted}`);
    console.log(`Summaries generated: ${stats.summariesGenerated}`);
    console.log(`Ready for scheduling: ${stats.readyForScheduling}`);
    console.log(`Skipped (no data): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (dryRun) {
      console.log("\n⚠️  DRY RUN MODE - No actual changes were made");
      console.log("Run without --dry-run to process cases");
    } else if (stats.readyForScheduling > 0) {
      console.log(
        `\n✅ ${stats.readyForScheduling} cases are now ready for scheduling!`,
      );
      console.log("Go to the dashboard to schedule discharge calls/emails.");
    } else {
      console.log("\n✅ Backfill complete!");
    }

    if (stats.errorDetails.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("ERROR DETAILS");
      console.log("=".repeat(60));
      stats.errorDetails.slice(0, 10).forEach((detail) => {
        console.log(`  ${detail.patientName}: ${detail.error}`);
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

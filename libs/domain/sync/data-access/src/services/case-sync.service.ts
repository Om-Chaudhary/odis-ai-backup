/**
 * Case Sync Service
 * Enriches cases with consultation data from PIMS
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@odis-ai/shared/types";
import type {
  IPimsProvider,
  PimsConsultation,
  CaseSyncOptions,
  SyncResult,
  SyncStats,
} from "../types.js";
import { createLogger } from "@odis-ai/shared/logger";
import { createSyncAudit, recordSyncAudit } from "../utils/sync-audit.js";
import { asCaseUpdateMetadata } from "../utils/metadata.js";
import { ProgressThrottler } from "../utils/progress-throttler.js";

const logger = createLogger("case-sync");

/**
 * Case row with PIMS metadata
 */
interface CaseWithPimsData {
  id: string;
  external_id: string | null;
  metadata: Json | null;
}

/**
 * PIMS appointment data from metadata
 */
interface PimsAppointmentMetadata {
  id: string;
  consultationId: string | null;
}

/**
 * CaseSyncService - Enriches cases with PIMS consultation data
 *
 * Responsibilities:
 * - Find cases with consultation IDs
 * - Fetch consultation data from PIMS
 * - Update cases with SOAP notes, discharge summary, products/services
 * - Track sync statistics
 */
export class CaseSyncService {
  constructor(
    private supabase: SupabaseClient,
    private provider: IPimsProvider,
    private clinicId: string,
  ) { }

  /**
   * Sync consultation data for cases in date range
   */
  async sync(options: CaseSyncOptions): Promise<SyncResult> {
    const syncId = crypto.randomUUID();
    const startTime = Date.now();
    const errors: Array<{
      message: string;
      context?: Record<string, unknown>;
    }> = [];

    logger.info("Starting case sync", {
      syncId,
      clinicId: this.clinicId,
      provider: this.provider.name,
      dateRange: {
        start: options.startDate.toISOString(),
        end: options.endDate.toISOString(),
      },
    });

    const stats: SyncStats = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    try {
      // Create initial sync audit with in_progress status
      await createSyncAudit({
        supabase: this.supabase,
        syncId,
        clinicId: this.clinicId,
        syncType: "cases",
      });

      // Initialize progress throttler (1-second throttle)
      const throttler = new ProgressThrottler(1000);

      // Find cases with consultation IDs that need enrichment
      const casesToEnrich = await this.findCasesNeedingEnrichment(
        options.startDate,
        options.endDate,
      );

      stats.total = casesToEnrich.length;

      logger.info("Found cases needing enrichment", {
        syncId,
        count: casesToEnrich.length,
      });

      if (casesToEnrich.length === 0) {
        // No cases to process - mark as complete
        await throttler.queueUpdate(
          {
            supabase: this.supabase,
            syncId,
            total_items: 0,
            processed_items: 0,
            progress_percentage: 100,
          },
          true,
        );

        return {
          success: true,
          syncId,
          stats,
          durationMs: Date.now() - startTime,
        };
      }

      // Extract consultation IDs
      const consultationMap = this.buildConsultationMap(casesToEnrich);
      const consultationIds = Array.from(consultationMap.keys());

      logger.info("Fetching consultations from PIMS", {
        syncId,
        count: consultationIds.length,
      });

      // Update with total count immediately (force)
      await throttler.queueUpdate(
        {
          supabase: this.supabase,
          syncId,
          total_items: casesToEnrich.length,
          processed_items: 0,
          progress_percentage: 0,
        },
        true,
      ); // Force immediate update

      // Batch fetch consultations
      const batchSize = options.parallelBatchSize ?? 5;
      const consultations = await this.fetchConsultationsBatched(
        consultationIds,
        batchSize,
      );

      logger.info("Fetched consultations", {
        syncId,
        requested: consultationIds.length,
        received: consultations.size,
      });

      // Update cases with consultation data
      let processedCount = 0;
      for (const [consultationId, caseIds] of Array.from(
        consultationMap.entries(),
      )) {
        const consultation = consultations.get(consultationId);

        for (const caseId of caseIds) {
          try {
            if (consultation) {
              await this.enrichCaseWithConsultation(caseId, consultation);
              stats.updated++;
            } else {
              // Consultation not found - mark as skipped
              stats.skipped++;
              logger.debug("Consultation not found for case", {
                caseId,
                consultationId,
              });
            }
          } catch (error) {
            stats.failed++;
            const message =
              error instanceof Error ? error.message : "Unknown error";
            errors.push({
              message: `Failed to enrich case ${caseId}: ${message}`,
              context: { caseId, consultationId },
            });
            logger.error("Failed to enrich case", {
              syncId,
              caseId,
              consultationId,
              error: message,
            });
          }

          // Update progress (throttled automatically)
          processedCount++;
          const percentage = Math.floor(
            (processedCount / casesToEnrich.length) * 100,
          );
          await throttler.queueUpdate({
            supabase: this.supabase,
            syncId,
            total_items: casesToEnrich.length,
            processed_items: processedCount,
            progress_percentage: percentage,
          });
        }
      }

      // Flush any pending updates before final completion
      await throttler.flush();

      // Record sync audit
      await recordSyncAudit({
        supabase: this.supabase,
        syncId,
        clinicId: this.clinicId,
        syncType: "cases",
        stats,
        success: errors.length === 0,
      });

      const durationMs = Date.now() - startTime;

      logger.info("Case sync completed", {
        syncId,
        stats,
        durationMs,
        hasErrors: errors.length > 0,
      });

      return {
        success: errors.length === 0,
        syncId,
        stats,
        durationMs,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const durationMs = Date.now() - startTime;

      logger.error("Case sync failed", {
        syncId,
        error: message,
        durationMs,
      });

      await recordSyncAudit({
        supabase: this.supabase,
        syncId,
        clinicId: this.clinicId,
        syncType: "cases",
        stats,
        success: false,
        errorMessage: message,
      });

      return {
        success: false,
        syncId,
        stats,
        durationMs,
        errors: [{ message }],
      };
    }
  }

  /**
   * Find cases that have consultation IDs but haven't been fully enriched
   *
   * IMPORTANT: Only queries cases where scheduled_at is in the past.
   * The IDEXX API only returns consultation data for COMPLETED consultations,
   * so we must skip future appointments to avoid "NOT FOUND" errors.
   */
  private async findCasesNeedingEnrichment(
    startDate: Date,
    endDate: Date,
  ): Promise<CaseWithPimsData[]> {
    // Cap endDate at current time - consultation data only exists for past appointments
    const now = new Date();
    const effectiveEndDate = endDate > now ? now : endDate;

    logger.debug("Finding cases needing enrichment", {
      clinicId: this.clinicId,
      startDate: startDate.toISOString(),
      originalEndDate: endDate.toISOString(),
      effectiveEndDate: effectiveEndDate.toISOString(),
      cappedAtNow: endDate > now,
    });

    const { data, error } = await this.supabase
      .from("cases")
      .select("id, external_id, metadata")
      .eq("clinic_id", this.clinicId)
      .gte("scheduled_at", startDate.toISOString())
      .lte("scheduled_at", effectiveEndDate.toISOString())
      .not("metadata->pimsAppointment->consultationId", "is", null);

    if (error) {
      throw new Error(`Failed to query cases: ${error.message}`);
    }

    // Filter to cases that haven't been enriched yet
    return (data ?? []).filter((caseRow) => {
      const metadata = caseRow.metadata as Record<string, unknown> | null;
      // Not enriched if no consultation data in metadata
      return !metadata?.pimsConsultation;
    });
  }

  /**
   * Build map of consultationId -> caseIds
   */
  private buildConsultationMap(
    cases: CaseWithPimsData[],
  ): Map<string, string[]> {
    const map = new Map<string, string[]>();

    for (const caseRow of cases) {
      const metadata = caseRow.metadata as Record<string, unknown> | null;
      const pimsAppointment = metadata?.pimsAppointment as
        | PimsAppointmentMetadata
        | undefined;
      const consultationId = pimsAppointment?.consultationId;

      if (consultationId) {
        const existing = map.get(consultationId) ?? [];
        existing.push(caseRow.id);
        map.set(consultationId, existing);
      }
    }

    return map;
  }

  /**
   * Fetch consultations in batches
   */
  private async fetchConsultationsBatched(
    consultationIds: string[],
    batchSize: number,
  ): Promise<Map<string, PimsConsultation>> {
    const results = new Map<string, PimsConsultation>();

    for (let i = 0; i < consultationIds.length; i += batchSize) {
      const batch = consultationIds.slice(i, i + batchSize);

      // Fetch batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (id) => {
          try {
            const consultation = await this.provider.fetchConsultation(id);
            return { id, consultation };
          } catch (error) {
            logger.warn("Failed to fetch consultation", {
              consultationId: id,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            return { id, consultation: null };
          }
        }),
      );

      for (const { id, consultation } of batchResults) {
        if (consultation) {
          results.set(id, consultation);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < consultationIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Enrich a case with consultation data
   */
  private async enrichCaseWithConsultation(
    caseId: string,
    consultation: PimsConsultation,
  ): Promise<void> {
    // Get current case
    const { data: currentCase, error: fetchError } = await this.supabase
      .from("cases")
      .select("metadata")
      .eq("id", caseId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch case: ${fetchError.message}`);
    }

    const currentMetadata = (currentCase?.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const currentEntities = currentMetadata.entities as
      | Record<string, unknown>
      | undefined;

    // Build enriched metadata
    const enrichedMetadata = {
      ...currentMetadata,
      pimsConsultation: consultation,
      entities: {
        ...currentEntities,
        clinical: {
          ...(currentEntities?.clinical as Record<string, unknown> | undefined),
          // Add consultation-specific fields
          clinicalNotes: consultation.notes ?? undefined,
          visitReason:
            consultation.reason ??
            (currentEntities?.clinical as Record<string, unknown>)?.visitReason,
          productsServicesProvided: consultation.productsServices
            ? consultation.productsServices.split("; ")
            : undefined,
          productsServicesDeclined: consultation.declinedProductsServices
            ? consultation.declinedProductsServices.split("; ")
            : undefined,
        },
      },
      // Store discharge summary at top level for VAPI
      dischargeSummary: consultation.dischargeSummary,
      enrichedAt: new Date().toISOString(),
    };

    // Update case
    const { error: updateError } = await this.supabase
      .from("cases")
      .update({
        metadata: asCaseUpdateMetadata(enrichedMetadata),
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId);

    if (updateError) {
      throw new Error(`Failed to update case: ${updateError.message}`);
    }

    logger.debug("Enriched case with consultation data", {
      caseId,
      consultationId: consultation.id,
      hasNotes: !!consultation.notes,
      hasDischargeSummary: !!consultation.dischargeSummary,
    });
  }
}

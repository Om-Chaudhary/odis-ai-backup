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
import { withRetry } from "../utils/retry.js";

const logger = createLogger("case-sync");

/**
 * Check if a Supabase fetch error is retryable.
 * These errors typically occur after browser resource exhaustion.
 */
function isSupabaseFetchRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("fetch failed") ||
    message.includes("TypeError") ||
    message.includes("ECONNRESET") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ENOTFOUND") ||
    message.includes("socket hang up")
  );
}

/**
 * Case row with PIMS metadata
 */
interface CaseWithPimsData {
  id: string;
  external_id: string | null;
  metadata: Json | null;
}

/**
 * Case that has pimsConsultation but needs AI generation
 */
interface CaseNeedingAIGeneration {
  id: string;
  pimsConsultation: PimsConsultation;
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
 * - Generate AI discharge summary and call intelligence
 * - Track sync statistics
 */
export class CaseSyncService {
  constructor(
    private supabase: SupabaseClient,
    private provider: IPimsProvider,
    private clinicId: string,
    private userId?: string,
  ) {}

  /**
   * Test Supabase connectivity.
   * Used to detect when browser operations have corrupted Node.js fetch state.
   */
  private async testSupabaseHealth(label: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("clinics")
        .select("id")
        .limit(1);
      logger.info(`Supabase health check [${label}]`, {
        success: !error,
        error: error?.message,
      });
      return !error;
    } catch (err) {
      logger.error(`Supabase health check [${label}] FAILED`, {
        error: err instanceof Error ? err.message : String(err),
        cause:
          err instanceof Error
            ? (err as Error & { cause?: unknown }).cause
            : undefined,
      });
      return false;
    }
  }

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

    const useBackgroundAI = options.backgroundAIGeneration ?? false;

    logger.info("Starting case sync", {
      syncId,
      clinicId: this.clinicId,
      provider: this.provider.name,
      dateRange: {
        start: options.startDate.toISOString(),
        end: options.endDate.toISOString(),
      },
      backgroundAIGeneration: useBackgroundAI,
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

      // Find cases that have pimsConsultation but need AI generation
      const casesNeedingAI = this.userId
        ? await this.findCasesNeedingAIGeneration(
            options.startDate,
            options.endDate,
          )
        : [];

      const totalCases = casesToEnrich.length + casesNeedingAI.length;
      stats.total = totalCases;

      logger.info("Found cases to process", {
        syncId,
        needingEnrichment: casesToEnrich.length,
        needingAIGeneration: casesNeedingAI.length,
        total: totalCases,
      });

      if (totalCases === 0) {
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
          total_items: totalCases,
          processed_items: 0,
          progress_percentage: 0,
        },
        true,
      ); // Force immediate update

      let processedCount = 0;

      // Phase 1: Enrich cases that need PIMS consultation data
      if (casesToEnrich.length > 0) {
        // Health check before heavy browser operations
        await this.testSupabaseHealth("BEFORE Phase 1 (browser operations)");

        // Batch fetch consultations (reduced from 5 to 2 to prevent browser resource exhaustion)
        const batchSize = options.parallelBatchSize ?? 2;
        const consultations = await this.fetchConsultationsBatched(
          consultationIds,
          batchSize,
        );

        // Health check after browser operations (before Phase 2 Supabase queries)
        await this.testSupabaseHealth("AFTER Phase 1 / BEFORE Phase 2");

        logger.info("Fetched consultations", {
          syncId,
          requested: consultationIds.length,
          received: consultations.size,
        });

        // Build list of case-consultation pairs to process
        const casesToProcess: Array<{
          caseId: string;
          consultationId: string;
          consultation: PimsConsultation;
        }> = [];

        for (const [consultationId, caseIds] of Array.from(
          consultationMap.entries(),
        )) {
          const consultation = consultations.get(consultationId);
          if (consultation) {
            for (const caseId of caseIds) {
              casesToProcess.push({ caseId, consultationId, consultation });
            }
          } else {
            // Consultation not found - mark as skipped
            stats.skipped += caseIds.length;
            processedCount += caseIds.length;
            for (const caseId of caseIds) {
              logger.debug("Consultation not found for case", {
                caseId,
                consultationId,
              });
            }
          }
        }

        if (casesToProcess.length > 0) {
          // Batch fetch all case metadata in one query
          const caseIdsToEnrich = casesToProcess.map((c) => c.caseId);
          const metadataMap =
            await this.batchFetchCaseMetadata(caseIdsToEnrich);

          // Build enriched metadata for all cases
          const updates: Array<{
            id: string;
            metadata: Record<string, unknown>;
            consultation: PimsConsultation;
          }> = [];

          for (const { caseId, consultation } of casesToProcess) {
            const currentMetadata = metadataMap.get(caseId) ?? {};
            const enrichedMetadata = this.buildEnrichedMetadata(
              currentMetadata,
              consultation,
            );
            updates.push({
              id: caseId,
              metadata: enrichedMetadata,
              consultation,
            });
          }

          // Batch upsert all metadata updates
          const { succeeded, failed: upsertFailed } =
            await this.batchUpsertCaseMetadata(updates);

          // Track successes
          stats.updated += succeeded.length;

          // Track failures
          for (const failure of upsertFailed) {
            stats.failed++;
            errors.push({
              message: `Failed to enrich case ${failure.id}: ${failure.error}`,
              context: { caseId: failure.id },
            });
            logger.error("Failed to enrich case", {
              syncId,
              caseId: failure.id,
              error: failure.error,
            });
          }

          // Update progress after batch enrichment
          processedCount += casesToProcess.length;
          const percentage = Math.floor((processedCount / totalCases) * 100);
          await throttler.queueUpdate(
            {
              supabase: this.supabase,
              syncId,
              total_items: totalCases,
              processed_items: processedCount,
              progress_percentage: percentage,
            },
            true,
          );

          // Trigger AI generation for enriched cases (only for successfully updated cases)
          const succeededSet = new Set(succeeded);
          const casesForAI: Array<{
            caseId: string;
            consultation: PimsConsultation;
          }> = [];

          for (const update of updates) {
            if (!succeededSet.has(update.id)) continue;

            const hasClinicalContent =
              !!update.consultation.notes ||
              !!update.consultation.dischargeSummary;
            if (hasClinicalContent && this.userId) {
              casesForAI.push({
                caseId: update.id,
                consultation: update.consultation,
              });
            }
          }

          if (casesForAI.length > 0) {
            if (useBackgroundAI) {
              // Queue AI generation jobs to QStash for background processing
              await this.queueAIGenerationBatch(casesForAI);
              logger.info("Queued AI generation jobs to background", {
                syncId,
                count: casesForAI.length,
              });
            } else {
              // Run AI generation inline (legacy behavior)
              for (const { caseId, consultation } of casesForAI) {
                try {
                  await this.triggerAIGeneration(caseId, consultation);
                } catch (error) {
                  // AI generation failures don't affect enrichment success
                  logger.error("AI generation failed after enrichment", {
                    caseId,
                    error:
                      error instanceof Error ? error.message : String(error),
                  });
                }
              }
            }
          }
        }
      }

      // Phase 2: Generate AI content for cases that have pimsConsultation but no discharge summary
      if (casesNeedingAI.length > 0) {
        logger.info("Processing cases needing AI generation", {
          syncId,
          count: casesNeedingAI.length,
          backgroundMode: useBackgroundAI,
        });

        if (useBackgroundAI) {
          // Queue all AI generation jobs to QStash for background processing
          const casesForAI = casesNeedingAI.map((caseData) => ({
            caseId: caseData.id,
            consultation: caseData.pimsConsultation,
          }));

          await this.queueAIGenerationBatch(casesForAI);
          stats.updated += casesNeedingAI.length;
          processedCount += casesNeedingAI.length;

          logger.info("Queued Phase 2 AI generation jobs to background", {
            syncId,
            count: casesNeedingAI.length,
          });

          // Update progress after batch queuing
          const percentage = Math.floor((processedCount / totalCases) * 100);
          await throttler.queueUpdate(
            {
              supabase: this.supabase,
              syncId,
              total_items: totalCases,
              processed_items: processedCount,
              progress_percentage: percentage,
            },
            true,
          );
        } else {
          // Run AI generation inline (legacy behavior)
          for (const caseData of casesNeedingAI) {
            try {
              await this.triggerAIGeneration(
                caseData.id,
                caseData.pimsConsultation,
              );
              stats.updated++;
            } catch (error) {
              stats.failed++;
              const message =
                error instanceof Error ? error.message : "Unknown error";
              errors.push({
                message: `Failed AI generation for case ${caseData.id}: ${message}`,
                context: { caseId: caseData.id },
              });
              logger.error("Failed AI generation for case", {
                syncId,
                caseId: caseData.id,
                error: message,
              });
            }

            // Update progress
            processedCount++;
            const percentage = Math.floor((processedCount / totalCases) * 100);
            await throttler.queueUpdate({
              supabase: this.supabase,
              syncId,
              total_items: totalCases,
              processed_items: processedCount,
              progress_percentage: percentage,
            });
          }
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
   * Find cases that have pimsConsultation data but are missing discharge summaries
   * These cases were enriched but AI generation failed (e.g., missing API key)
   */
  private async findCasesNeedingAIGeneration(
    startDate: Date,
    endDate: Date,
  ): Promise<CaseNeedingAIGeneration[]> {
    // Cap endDate at current time
    const now = new Date();
    const effectiveEndDate = endDate > now ? now : endDate;

    // Find cases with pimsConsultation that don't have a discharge_summary
    const { data: cases, error } = await this.supabase
      .from("cases")
      .select("id, metadata")
      .eq("clinic_id", this.clinicId)
      .gte("scheduled_at", startDate.toISOString())
      .lte("scheduled_at", effectiveEndDate.toISOString())
      .not("metadata->pimsConsultation", "is", null);

    if (error) {
      throw new Error(
        `Failed to query cases for AI generation: ${error.message}`,
      );
    }

    if (!cases || cases.length === 0) {
      return [];
    }

    // Get case IDs that already have discharge summaries (batched to avoid URL length limits)
    const caseIds = cases.map((c) => c.id);
    const casesWithSummaries =
      await this.queryDischargeSummariesBatched(caseIds);

    // Filter to cases that need AI generation
    return cases
      .filter((caseRow) => !casesWithSummaries.has(caseRow.id))
      .map((caseRow) => {
        const metadata = caseRow.metadata as Record<string, unknown>;
        return {
          id: caseRow.id,
          pimsConsultation: metadata.pimsConsultation as PimsConsultation,
        };
      })
      .filter((c) => {
        // Only include cases with clinical content
        const consultation = c.pimsConsultation;
        return !!consultation.notes || !!consultation.dischargeSummary;
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
   * Query discharge summaries in batches to avoid URL length limits
   * PostgREST can fail with large .in() clauses due to URL size constraints
   *
   * Includes retry logic to handle transient network errors that can occur
   * after heavy browser automation operations.
   */
  private async queryDischargeSummariesBatched(
    caseIds: string[],
  ): Promise<Set<string>> {
    const casesWithSummaries = new Set<string>();
    const batchSize = 50;
    const totalBatches = Math.ceil(caseIds.length / batchSize);

    logger.info("queryDischargeSummariesBatched: Starting", {
      totalCaseIds: caseIds.length,
      batchSize,
      totalBatches,
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });

    for (let i = 0; i < caseIds.length; i += batchSize) {
      const batch = caseIds.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      logger.debug(
        `Batch ${batchNumber}/${totalBatches}: Querying ${batch.length} case IDs`,
      );

      try {
        // Wrap in retry logic to handle transient fetch failures after browser operations
        const result = await withRetry(
          async () => {
            const { data, error } = await this.supabase
              .from("discharge_summaries")
              .select("case_id")
              .in("case_id", batch);

            if (error) {
              // Throw to trigger retry for Supabase errors
              throw new Error(`Supabase error: ${error.message}`);
            }
            return data;
          },
          {
            maxRetries: 3,
            baseDelayMs: 1000,
            maxDelayMs: 5000,
            shouldRetry: isSupabaseFetchRetryable,
            onRetry: (err, attempt, delay) => {
              logger.warn(
                `Batch ${batchNumber} retry ${attempt} after fetch failure`,
                {
                  error: err instanceof Error ? err.message : String(err),
                  delayMs: delay,
                },
              );
            },
          },
        );

        if (!result.success) {
          // Log detailed error info including cause chain
          const err = result.error;
          logger.error(`Batch ${batchNumber} failed after retries`, {
            name: err instanceof Error ? err.name : "Unknown",
            message: err instanceof Error ? err.message : String(err),
            cause:
              err instanceof Error
                ? (err as Error & { cause?: unknown }).cause
                : undefined,
            heapUsedMB: Math.round(
              process.memoryUsage().heapUsed / 1024 / 1024,
            ),
          });
          throw new Error(
            `Failed to query discharge summaries (batch ${batchNumber}): ${err instanceof Error ? err.message : String(err)}`,
          );
        }

        for (const row of result.data ?? []) {
          casesWithSummaries.add(row.case_id);
        }
      } catch (err) {
        // Log exception with full details
        logger.error(`Batch ${batchNumber} exception`, {
          name: err instanceof Error ? err.name : "Unknown",
          message: err instanceof Error ? err.message : String(err),
          cause:
            err instanceof Error
              ? (err as Error & { cause?: unknown }).cause
              : undefined,
        });
        throw err;
      }
    }

    logger.info("queryDischargeSummariesBatched: Completed", {
      totalCaseIds: caseIds.length,
      totalFound: casesWithSummaries.size,
    });

    return casesWithSummaries;
  }

  /**
   * Batch fetch case metadata for multiple cases
   * Reduces N queries to ceil(N/50) queries
   */
  private async batchFetchCaseMetadata(
    caseIds: string[],
  ): Promise<Map<string, Record<string, unknown>>> {
    const metadataMap = new Map<string, Record<string, unknown>>();
    const batchSize = 50;

    for (let i = 0; i < caseIds.length; i += batchSize) {
      const batch = caseIds.slice(i, i + batchSize);

      const result = await withRetry(
        async () => {
          const { data, error } = await this.supabase
            .from("cases")
            .select("id, metadata")
            .in("id", batch);

          if (error) {
            throw new Error(`Supabase error: ${error.message}`);
          }
          return data;
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 5000,
          shouldRetry: isSupabaseFetchRetryable,
        },
      );

      if (!result.success) {
        throw new Error(
          `Failed to fetch case metadata: ${result.error instanceof Error ? result.error.message : String(result.error)}`,
        );
      }

      for (const row of result.data ?? []) {
        metadataMap.set(
          row.id,
          (row.metadata as Record<string, unknown>) ?? {},
        );
      }
    }

    logger.debug("Batch fetched case metadata", {
      requested: caseIds.length,
      received: metadataMap.size,
    });

    return metadataMap;
  }

  /**
   * Build enriched metadata for a case without database operations
   */
  private buildEnrichedMetadata(
    currentMetadata: Record<string, unknown>,
    consultation: PimsConsultation,
  ): Record<string, unknown> {
    const currentEntities = currentMetadata.entities as
      | Record<string, unknown>
      | undefined;

    return {
      ...currentMetadata,
      pimsConsultation: consultation,
      entities: {
        ...currentEntities,
        clinical: {
          ...(currentEntities?.clinical as Record<string, unknown> | undefined),
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
      dischargeSummary: consultation.dischargeSummary,
      enrichedAt: new Date().toISOString(),
    };
  }

  /**
   * Batch upsert case metadata updates
   * Reduces N update queries to ceil(N/50) queries
   */
  private async batchUpsertCaseMetadata(
    updates: Array<{ id: string; metadata: Record<string, unknown> }>,
  ): Promise<{
    succeeded: string[];
    failed: Array<{ id: string; error: string }>;
  }> {
    const succeeded: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    const batchSize = 50;
    const now = new Date().toISOString();

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      try {
        const result = await withRetry(
          async () => {
            // Use upsert with onConflict to update existing records
            const { error } = await this.supabase.from("cases").upsert(
              batch.map((update) => ({
                id: update.id,
                metadata: asCaseUpdateMetadata(update.metadata),
                updated_at: now,
              })),
              { onConflict: "id", ignoreDuplicates: false },
            );

            if (error) {
              throw new Error(`Supabase error: ${error.message}`);
            }
            return batch.map((u) => u.id);
          },
          {
            maxRetries: 3,
            baseDelayMs: 1000,
            maxDelayMs: 5000,
            shouldRetry: isSupabaseFetchRetryable,
          },
        );

        if (result.success && result.data) {
          succeeded.push(...result.data);
        } else if (!result.success) {
          // Mark all in batch as failed
          for (const update of batch) {
            failed.push({
              id: update.id,
              error:
                result.error instanceof Error
                  ? result.error.message
                  : String(result.error),
            });
          }
        }
      } catch (err) {
        logger.error(`Batch ${batchNumber} upsert exception`, {
          error: err instanceof Error ? err.message : String(err),
        });
        for (const update of batch) {
          failed.push({
            id: update.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    logger.info("Batch upsert completed", {
      total: updates.length,
      succeeded: succeeded.length,
      failed: failed.length,
    });

    return { succeeded, failed };
  }

  /**
   * Enrich a case with consultation data (legacy single-case method for compatibility)
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
    const enrichedMetadata = this.buildEnrichedMetadata(
      currentMetadata,
      consultation,
    );

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

  /**
   * Queue AI generation jobs to QStash for background processing
   * This allows the sync to complete quickly while AI work happens async
   */
  private async queueAIGenerationBatch(
    cases: Array<{ caseId: string; consultation: PimsConsultation }>,
  ): Promise<void> {
    if (!this.userId) {
      logger.debug("Skipping AI queue - no userId available");
      return;
    }

    const payloads = cases.map(({ caseId, consultation }) => ({
      caseId,
      userId: this.userId!,
      consultation: {
        id: consultation.id,
        notes: consultation.notes ?? undefined,
        dischargeSummary: consultation.dischargeSummary ?? undefined,
        productsServices: consultation.productsServices ?? undefined,
        declinedProductsServices:
          consultation.declinedProductsServices ?? undefined,
        reason: consultation.reason ?? undefined,
      },
    }));

    type ScheduleBatch = (p: typeof payloads) => Promise<string[]>;

    try {
      const { scheduleAIEnrichmentBatch } =
        await import("@odis-ai/integrations/qstash");
      const scheduleBatch = scheduleAIEnrichmentBatch as ScheduleBatch;
      const messageIds = await scheduleBatch(payloads);
      logger.info("Queued AI enrichment batch to QStash", {
        requested: payloads.length,
        scheduled: messageIds.length,
      });
    } catch (error) {
      // Log but don't fail the sync - AI generation is best-effort
      logger.error("Failed to queue AI enrichment batch", {
        count: payloads.length,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Trigger AI generation for a case after enrichment (inline)
   * - Extract entities from clinical notes
   * - Generate structured discharge summary
   * - Generate call intelligence
   */
  private async triggerAIGeneration(
    caseId: string,
    consultation: PimsConsultation,
  ): Promise<void> {
    if (!this.userId) {
      logger.debug("Skipping AI generation - no userId available", { caseId });
      return;
    }

    try {
      // Import case-ai functions dynamically to avoid circular dependencies
      const {
        extractEntitiesFromIdexx,
        autoGenerateDischargeSummary,
        generateAndStoreCallIntelligence,
      } = await import("@odis-ai/domain/cases");

      // Build raw data for entity extraction
      // Use dischargeSummary as fallback since IDEXX returns clinical content there
      const rawIdexxData: Record<string, unknown> = {
        consultation_notes: consultation.notes ?? consultation.dischargeSummary,
        products_services: consultation.productsServices,
        declined_products_services: consultation.declinedProductsServices,
        reason: consultation.reason,
      };

      // Extract entities from clinical notes
      const entities = await extractEntitiesFromIdexx(rawIdexxData);

      if (!entities) {
        logger.debug("Entity extraction returned null - skipping generation", {
          caseId,
          notesLength:
            (consultation.notes ?? consultation.dischargeSummary)?.length ?? 0,
        });
        return;
      }

      logger.info("Extracted entities from PIMS consultation", {
        caseId,
        patientName: entities.patient.name,
        hasDiagnoses: !!entities.clinical.diagnoses?.length,
      });

      // Generate discharge summary and call intelligence in parallel
      // Both depend only on entities, not on each other
      const [summaryResult, intelligenceResult] = await Promise.all([
        autoGenerateDischargeSummary(
          this.supabase as unknown as Parameters<
            typeof autoGenerateDischargeSummary
          >[0],
          this.userId,
          caseId,
          entities,
        ),
        generateAndStoreCallIntelligence(
          this.supabase as unknown as Parameters<
            typeof generateAndStoreCallIntelligence
          >[0],
          caseId,
          entities,
        ),
      ]);

      if (summaryResult) {
        logger.info("Generated discharge summary for PIMS case", {
          caseId,
          summaryId: summaryResult.summaryId,
        });
      }

      if (intelligenceResult) {
        logger.info("Generated call intelligence for PIMS case", {
          caseId,
          questionCount: intelligenceResult.assessmentQuestions?.length ?? 0,
        });
      }
    } catch (error) {
      // Log but don't fail the sync - generation is best-effort
      logger.error("AI generation failed for PIMS case", {
        caseId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

/**
 * Sync Orchestrator
 * Coordinates sync operations across all services
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type {
  IPimsProvider,
  InboundSyncOptions,
  CaseSyncOptions,
  ReconciliationOptions,
  SyncResult,
  ReconciliationResult,
} from "../types";
import { InboundSyncService } from "./inbound-sync.service";
import { CaseSyncService } from "./case-sync.service";
import { CaseReconciler } from "./case-reconciler.service";
import { createLogger } from "@odis-ai/shared/logger";

const logger = createLogger("sync-orchestrator");

/**
 * Combined sync result
 */
export interface FullSyncResult {
  inbound?: SyncResult;
  cases?: SyncResult;
  reconciliation?: ReconciliationResult;
  totalDurationMs: number;
  success: boolean;
}

/**
 * Full sync options
 */
export interface FullSyncOptions {
  /** Skip inbound sync */
  skipInbound?: boolean;
  /** Skip case enrichment */
  skipCases?: boolean;
  /** Skip reconciliation */
  skipReconciliation?: boolean;
  /** Inbound sync options */
  inboundOptions?: InboundSyncOptions;
  /** Case sync options */
  caseOptions?: Omit<CaseSyncOptions, "startDate" | "endDate">;
  /** Reconciliation options */
  reconciliationOptions?: ReconciliationOptions;
}

/**
 * Bidirectional sync options
 */
export interface BidirectionalSyncOptions {
  /** Days to look backward (default: 14) */
  lookbackDays?: number;
  /** Days to look forward (default: 14) */
  forwardDays?: number;
  /** Skip backward sync */
  skipBackwardSync?: boolean;
  /** Skip forward sync */
  skipForwardSync?: boolean;
  /** Skip case enrichment */
  skipCaseEnrichment?: boolean;
  /** Skip reconciliation */
  skipReconciliation?: boolean;
  /** Reconciliation lookback days (default: 7) */
  reconciliationLookbackDays?: number;
  /** Parallel batch size for case enrichment */
  parallelBatchSize?: number;
}

/**
 * Bidirectional sync result
 */
export interface BidirectionalSyncResult extends FullSyncResult {
  backwardInbound?: SyncResult;
  forwardInbound?: SyncResult;
}

/**
 * SyncOrchestrator - Coordinates all sync operations
 *
 * Orchestrates the sync flow:
 * 1. Inbound sync - fetch appointments from PIMS
 * 2. Case sync - enrich cases with consultation data
 * 3. Reconciliation - clean up orphaned cases
 */
export class SyncOrchestrator {
  private inboundService: InboundSyncService;
  private caseService: CaseSyncService;
  private reconciler: CaseReconciler;

  constructor(
    private supabase: SupabaseClient<Database>,
    private provider: IPimsProvider,
    private clinicId: string,
  ) {
    this.inboundService = new InboundSyncService(supabase, provider, clinicId);
    this.caseService = new CaseSyncService(supabase, provider, clinicId);
    this.reconciler = new CaseReconciler(supabase, provider, clinicId);
  }

  /**
   * Run full sync (all three phases)
   */
  async runFullSync(options?: FullSyncOptions): Promise<FullSyncResult> {
    const startTime = Date.now();
    const result: FullSyncResult = {
      totalDurationMs: 0,
      success: true,
    };

    logger.info("Starting full sync", {
      clinicId: this.clinicId,
      provider: this.provider.name,
      options,
    });

    try {
      // Phase 1: Inbound sync
      if (!options?.skipInbound) {
        result.inbound = await this.inboundService.sync(
          options?.inboundOptions,
        );
        if (!result.inbound.success) {
          result.success = false;
          logger.warn("Inbound sync failed, continuing with other phases", {
            errors: result.inbound.errors,
          });
        }
      }

      // Phase 2: Case sync (enrich with consultation data)
      // Note: CaseSyncService internally caps endDate at current time since
      // consultation data is only available for past/completed appointments
      if (!options?.skipCases) {
        const dateRange = this.getDateRangeFromInbound(options?.inboundOptions);
        logger.info("Starting case sync phase", {
          clinicId: this.clinicId,
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          note: "CaseSyncService will cap endDate at current time for consultation fetch",
        });
        result.cases = await this.caseService.sync({
          ...dateRange,
          ...options?.caseOptions,
        });
        if (!result.cases.success) {
          result.success = false;
          logger.warn("Case sync failed, continuing with reconciliation", {
            errors: result.cases.errors,
          });
        }
      }

      // Phase 3: Reconciliation
      if (!options?.skipReconciliation) {
        result.reconciliation = await this.reconciler.reconcile(
          options?.reconciliationOptions,
        );
        if (!result.reconciliation.success) {
          result.success = false;
          logger.warn("Reconciliation failed", {
            errors: result.reconciliation.errors,
          });
        }
      }

      result.totalDurationMs = Date.now() - startTime;

      logger.info("Full sync completed", {
        clinicId: this.clinicId,
        totalDurationMs: result.totalDurationMs,
        success: result.success,
        stats: {
          inbound: result.inbound?.stats,
          cases: result.cases?.stats,
          reconciliation: result.reconciliation?.stats,
        },
      });

      return result;
    } catch (error) {
      result.totalDurationMs = Date.now() - startTime;
      result.success = false;

      logger.error("Full sync failed with unexpected error", {
        clinicId: this.clinicId,
        error: error instanceof Error ? error.message : "Unknown error",
        totalDurationMs: result.totalDurationMs,
      });

      return result;
    }
  }

  /**
   * Run inbound sync only
   */
  async runInboundSync(options?: InboundSyncOptions): Promise<SyncResult> {
    return this.inboundService.sync(options);
  }

  /**
   * Run case sync only
   */
  async runCaseSync(options: CaseSyncOptions): Promise<SyncResult> {
    return this.caseService.sync(options);
  }

  /**
   * Run reconciliation only
   */
  async runReconciliation(
    options?: ReconciliationOptions,
  ): Promise<ReconciliationResult> {
    return this.reconciler.reconcile(options);
  }

  /**
   * Run bidirectional sync (backward + forward)
   * 
   * This is the recommended sync strategy for comprehensive clinic data management:
   * 1. Backward inbound sync - captures historical cases from the past (default: 14 days)
   * 2. Case enrichment - adds consultation data to past cases (SOAP notes, discharge summaries)
   * 3. Forward inbound sync - populates future appointments for VAPI scheduling (default: 14 days)
   * 4. Reconciliation - cleans up orphaned cases (default: 7 day lookback)
   */
  async runBidirectionalSync(
    options?: BidirectionalSyncOptions,
  ): Promise<BidirectionalSyncResult> {
    const startTime = Date.now();
    const lookbackDays = options?.lookbackDays ?? 14;
    const forwardDays = options?.forwardDays ?? 14;
    const reconciliationLookbackDays = options?.reconciliationLookbackDays ?? 7;

    const result: BidirectionalSyncResult = {
      totalDurationMs: 0,
      success: true,
    };

    logger.info("Starting bidirectional sync", {
      clinicId: this.clinicId,
      provider: this.provider.name,
      lookbackDays,
      forwardDays,
      options,
    });

    try {
      // Phase 1: Backward inbound sync (past cases)
      if (!options?.skipBackwardSync) {
        const backwardStart = new Date();
        backwardStart.setDate(backwardStart.getDate() - lookbackDays);
        backwardStart.setHours(0, 0, 0, 0);

        const backwardEnd = new Date();
        backwardEnd.setHours(23, 59, 59, 999);

        logger.info("Running backward inbound sync", {
          clinicId: this.clinicId,
          startDate: backwardStart.toISOString(),
          endDate: backwardEnd.toISOString(),
        });

        result.backwardInbound = await this.inboundService.sync({
          dateRange: {
            start: backwardStart,
            end: backwardEnd,
          },
        });

        if (!result.backwardInbound.success) {
          result.success = false;
          logger.warn("Backward inbound sync failed, continuing with other phases", {
            errors: result.backwardInbound.errors,
          });
        }
      }

      // Phase 2: Case enrichment (only on backward range - past appointments have consultation data)
      if (!options?.skipCaseEnrichment && result.backwardInbound) {
        const backwardStart = new Date();
        backwardStart.setDate(backwardStart.getDate() - lookbackDays);
        backwardStart.setHours(0, 0, 0, 0);

        const backwardEnd = new Date();
        backwardEnd.setHours(23, 59, 59, 999);

        logger.info("Running case enrichment on backward range", {
          clinicId: this.clinicId,
          startDate: backwardStart.toISOString(),
          endDate: backwardEnd.toISOString(),
          note: "Consultation data only available for past appointments",
        });

        result.cases = await this.caseService.sync({
          startDate: backwardStart,
          endDate: backwardEnd,
          parallelBatchSize: options?.parallelBatchSize,
        });

        if (!result.cases.success) {
          result.success = false;
          logger.warn("Case enrichment failed, continuing with other phases", {
            errors: result.cases.errors,
          });
        }
      }

      // Phase 3: Forward inbound sync (future appointments for VAPI scheduling)
      if (!options?.skipForwardSync) {
        const forwardStart = new Date();
        forwardStart.setHours(0, 0, 0, 0);

        const forwardEnd = new Date();
        forwardEnd.setDate(forwardEnd.getDate() + forwardDays);
        forwardEnd.setHours(23, 59, 59, 999);

        logger.info("Running forward inbound sync", {
          clinicId: this.clinicId,
          startDate: forwardStart.toISOString(),
          endDate: forwardEnd.toISOString(),
        });

        result.forwardInbound = await this.inboundService.sync({
          dateRange: {
            start: forwardStart,
            end: forwardEnd,
          },
        });

        if (!result.forwardInbound.success) {
          result.success = false;
          logger.warn("Forward inbound sync failed, continuing with reconciliation", {
            errors: result.forwardInbound.errors,
          });
        }
      }

      // Phase 4: Reconciliation
      if (!options?.skipReconciliation) {
        logger.info("Running reconciliation", {
          clinicId: this.clinicId,
          lookbackDays: reconciliationLookbackDays,
        });

        result.reconciliation = await this.reconciler.reconcile({
          lookbackDays: reconciliationLookbackDays,
        });

        if (!result.reconciliation.success) {
          result.success = false;
          logger.warn("Reconciliation failed", {
            errors: result.reconciliation.errors,
          });
        }
      }

      result.totalDurationMs = Date.now() - startTime;

      logger.info("Bidirectional sync completed", {
        clinicId: this.clinicId,
        totalDurationMs: result.totalDurationMs,
        success: result.success,
        stats: {
          backwardInbound: result.backwardInbound?.stats,
          forwardInbound: result.forwardInbound?.stats,
          cases: result.cases?.stats,
          reconciliation: result.reconciliation?.stats,
        },
      });

      return result;
    } catch (error) {
      result.totalDurationMs = Date.now() - startTime;
      result.success = false;

      logger.error("Bidirectional sync failed with unexpected error", {
        clinicId: this.clinicId,
        error: error instanceof Error ? error.message : "Unknown error",
        totalDurationMs: result.totalDurationMs,
      });

      return result;
    }
  }

  /**
   * Get date range for case sync based on inbound options
   */
  private getDateRangeFromInbound(inboundOptions?: InboundSyncOptions): {
    startDate: Date;
    endDate: Date;
  } {
    if (inboundOptions?.dateRange) {
      return {
        startDate: inboundOptions.dateRange.start,
        endDate: inboundOptions.dateRange.end,
      };
    }

    // Default: today + next 7 days
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }
}

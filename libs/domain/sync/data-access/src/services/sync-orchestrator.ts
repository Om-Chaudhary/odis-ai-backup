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
      if (!options?.skipCases) {
        const dateRange = this.getDateRangeFromInbound(options?.inboundOptions);
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

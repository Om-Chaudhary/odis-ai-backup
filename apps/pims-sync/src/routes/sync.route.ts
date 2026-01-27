/**
 * Sync Routes
 *
 * API routes for triggering PIMS sync operations.
 * Uses domain sync services with IDEXX provider.
 *
 * Endpoints:
 * - POST /api/sync/inbound   - Sync appointments from PIMS
 * - POST /api/sync/cases     - Enrich cases with consultation data
 * - POST /api/sync/reconcile - 7-day historical reconciliation
 * - POST /api/sync/full      - Run all three sync phases
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { apiKeyAuth, type AuthenticatedRequest } from "../middleware";
import { PersistenceService } from "../services/persistence.service";
import { config } from "../config";
import { createSupabaseServiceClient } from "../lib/supabase";
import type { IdexxProvider } from "@odis-ai/integrations/idexx";
import type { PimsCredentials } from "@odis-ai/domain/sync";

export const syncRouter: ReturnType<typeof Router> = Router();

// Apply API key authentication to all sync routes
// Wrap async middleware to handle promise rejections
syncRouter.use((req: Request, res: Response, next: NextFunction) => {
  void apiKeyAuth()(req, res, next);
});

/**
 * POST /api/sync/inbound
 *
 * Sync appointments from PIMS to database.
 * Creates or updates case records based on appointments.
 */
syncRouter.post("/inbound", (req: Request, res: Response) => {
  void handleInboundSync(req as AuthenticatedRequest, res);
});

/**
 * POST /api/sync/cases
 *
 * Enrich cases with consultation data from PIMS.
 * Fetches SOAP notes, discharge summaries, etc.
 */
syncRouter.post("/cases", (req: Request, res: Response) => {
  void handleCaseSync(req as AuthenticatedRequest, res);
});

/**
 * POST /api/sync/reconcile
 *
 * Reconcile local cases with PIMS source of truth.
 * Soft-deletes orphaned cases and updates statuses.
 */
syncRouter.post("/reconcile", (req: Request, res: Response) => {
  void handleReconciliation(req as AuthenticatedRequest, res);
});

/**
 * POST /api/sync/full
 *
 * Run full sync pipeline:
 * 1. Inbound sync (appointments)
 * 2. Case sync (consultation enrichment)
 * 3. Reconciliation (7-day cleanup)
 */
syncRouter.post("/full", (req: Request, res: Response) => {
  void handleFullSync(req as AuthenticatedRequest, res);
});

/**
 * Request body types
 */
interface InboundSyncRequest {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  daysAhead?: number;
  /** Alternative nested format for date range */
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface CaseSyncRequest {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  parallelBatchSize?: number;
  /** Alternative nested format for date range */
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface ReconciliationRequest {
  lookbackDays?: number;
}

interface FullSyncRequest {
  startDate?: string;
  endDate?: string;
  daysAhead?: number;
  lookbackDays?: number;
  /** Number of days to look backward (default: 14) */
  backwardDays?: number;
  /** Number of days to look forward (default: 14) */
  forwardDays?: number;
  /** Use bidirectional sync (backward + forward) instead of simple forward sync */
  bidirectional?: boolean;
  /** Alternative nested format for date range */
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * Handle inbound sync request
 */
async function handleInboundSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as InboundSyncRequest;

  logger.info("Starting inbound sync", { clinicId: clinic.id });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup } = await createProviderForClinic(
      clinic.id,
    );

    try {
      // Authenticate with PIMS
      const authenticated = await provider.authenticate(credentials);
      if (!authenticated) {
        res.status(401).json({
          success: false,
          error: "PIMS authentication failed",
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create Supabase client
      const supabase = createSupabaseServiceClient();

      // Create sync service
      const { InboundSyncService } = await import("@odis-ai/domain/sync");
      const syncService = new InboundSyncService(supabase, provider, clinic.id);

      // Build date range - support both flat (startDate/endDate) and nested (dateRange.start/end) formats
      const dateRange = buildDateRange(
        body.startDate ?? body.dateRange?.start,
        body.endDate ?? body.dateRange?.end,
        body.daysAhead ?? 7,
      );

      // Run sync
      const result = await syncService.sync({ dateRange });

      logger.info("Inbound sync completed", {
        clinicId: clinic.id,
        syncId: result.syncId,
        stats: result.stats,
        durationMs: result.durationMs,
      });

      res.status(result.success ? 200 : 500).json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Inbound sync failed", {
      clinicId: clinic.id,
      error: errorMessage,
    });

    res.status(500).json({
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle case sync request
 */
async function handleCaseSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as CaseSyncRequest;

  logger.info("Starting case sync", { clinicId: clinic.id });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup, userId } = await createProviderForClinic(
      clinic.id,
    );

    try {
      // Authenticate with PIMS
      const authenticated = await provider.authenticate(credentials);
      if (!authenticated) {
        res.status(401).json({
          success: false,
          error: "PIMS authentication failed",
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create Supabase client
      const supabase = createSupabaseServiceClient();

      // Create sync service with userId for AI generation
      const { CaseSyncService } = await import("@odis-ai/domain/sync");
      const syncService = new CaseSyncService(supabase, provider, clinic.id, userId);

      // Build date range (default: today only)
      // Support both flat (startDate/endDate) and nested (dateRange.start/end) formats
      const startDateStr = body.startDate ?? body.dateRange?.start;
      const endDateStr = body.endDate ?? body.dateRange?.end;

      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      startDate.setHours(0, 0, 0, 0);

      const endDate = endDateStr ? new Date(endDateStr) : new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      // Run sync
      const result = await syncService.sync({
        startDate,
        endDate,
        parallelBatchSize: body.parallelBatchSize,
      });

      logger.info("Case sync completed", {
        clinicId: clinic.id,
        syncId: result.syncId,
        stats: result.stats,
        durationMs: result.durationMs,
      });

      res.status(result.success ? 200 : 500).json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Case sync failed", {
      clinicId: clinic.id,
      error: errorMessage,
    });

    res.status(500).json({
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle reconciliation request
 */
async function handleReconciliation(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as ReconciliationRequest;

  logger.info("Starting reconciliation", { clinicId: clinic.id });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup } = await createProviderForClinic(
      clinic.id,
    );

    try {
      // Authenticate with PIMS
      const authenticated = await provider.authenticate(credentials);
      if (!authenticated) {
        res.status(401).json({
          success: false,
          error: "PIMS authentication failed",
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create Supabase client
      const supabase = createSupabaseServiceClient();

      // Create reconciler
      const { CaseReconciler } = await import("@odis-ai/domain/sync");
      const reconciler = new CaseReconciler(supabase, provider, clinic.id);

      // Run reconciliation
      const result = await reconciler.reconcile({
        lookbackDays: body.lookbackDays,
      });

      logger.info("Reconciliation completed", {
        clinicId: clinic.id,
        syncId: result.syncId,
        stats: result.stats,
        durationMs: result.durationMs,
        deletedCases: result.deletedCases?.length ?? 0,
      });

      res.status(result.success ? 200 : 500).json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Reconciliation failed", {
      clinicId: clinic.id,
      error: errorMessage,
    });

    res.status(500).json({
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle full sync request
 */
async function handleFullSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as FullSyncRequest;

  logger.info("Starting full sync", { clinicId: clinic.id });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup, userId } = await createProviderForClinic(
      clinic.id,
    );

    try {
      // Authenticate with PIMS
      const authenticated = await provider.authenticate(credentials);
      if (!authenticated) {
        res.status(401).json({
          success: false,
          error: "PIMS authentication failed",
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create Supabase client
      const supabase = createSupabaseServiceClient();

      // Create orchestrator with userId for AI generation
      const { SyncOrchestrator } = await import("@odis-ai/domain/sync");
      const orchestrator = new SyncOrchestrator(supabase, provider, clinic.id, userId);

      // Use bidirectional sync if requested (default: true for comprehensive sync)
      const useBidirectional = body.bidirectional ?? true;

      let result;

      if (useBidirectional) {
        // Bidirectional sync: backward (past cases) + forward (future appointments)
        const backwardDays = body.backwardDays ?? body.lookbackDays ?? 14;
        const forwardDays = body.forwardDays ?? body.daysAhead ?? 14;

        logger.info("Running bidirectional sync", {
          clinicId: clinic.id,
          backwardDays,
          forwardDays,
        });

        result = await orchestrator.runBidirectionalSync({
          lookbackDays: backwardDays,
          forwardDays: forwardDays,
          reconciliationLookbackDays: 7,
        });

        logger.info("Bidirectional sync completed", {
          clinicId: clinic.id,
          phases: {
            backwardInbound: result.backwardInbound?.success,
            forwardInbound: result.forwardInbound?.success,
            cases: result.cases?.success,
            reconciliation: result.reconciliation?.success,
          },
          durationMs: result.totalDurationMs,
        });
      } else {
        // Legacy forward-only sync
        const dateRange = buildDateRange(
          body.startDate ?? body.dateRange?.start,
          body.endDate ?? body.dateRange?.end,
          body.daysAhead ?? 7,
        );

        logger.info("Running legacy forward sync", {
          clinicId: clinic.id,
          dateRange,
        });

        result = await orchestrator.runFullSync({
          inboundOptions: {
            dateRange,
          },
          reconciliationOptions: {
            lookbackDays: body.lookbackDays ?? 7,
          },
        });

        logger.info("Full sync completed", {
          clinicId: clinic.id,
          phases: {
            inbound: result.inbound?.success,
            cases: result.cases?.success,
            reconciliation: result.reconciliation?.success,
          },
          durationMs: result.totalDurationMs,
        });
      }

      res.status(result.success ? 200 : 500).json({
        ...result,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Full sync failed", {
      clinicId: clinic.id,
      error: errorMessage,
    });

    res.status(500).json({
      success: false,
      error: errorMessage,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Create IDEXX provider for a clinic
 */
async function createProviderForClinic(clinicId: string): Promise<{
  provider: IdexxProvider;
  credentials: PimsCredentials;
  cleanup: () => Promise<void>;
  userId: string;
}> {
  // Get credentials
  const persistence = new PersistenceService();
  const credentialResult = await persistence.getClinicCredentials(clinicId);

  if (!credentialResult) {
    throw new Error(`No credentials found for clinic ${clinicId}`);
  }

  // Import browser and provider
  const { BrowserService } = await import("@odis-ai/integrations/idexx");
  const { IdexxProvider } = await import("@odis-ai/integrations/idexx");

  // Create browser service
  const browserService = new BrowserService({
    headless: config.HEADLESS,
    defaultTimeout: config.SYNC_TIMEOUT_MS,
  });

  // Launch browser
  await browserService.launch();

  // Create provider
  const provider = new IdexxProvider({
    browserService,
    debug: config.NODE_ENV === "development",
  });

  // Map credentials to PIMS format
  const credentials = {
    username: credentialResult.credentials.username,
    password: credentialResult.credentials.password,
    companyId: credentialResult.credentials.companyId,
  };

  return {
    provider,
    credentials,
    cleanup: async () => {
      await provider.close();
    },
    userId: credentialResult.userId,
  };
}

/**
 * Build date range from request parameters
 */
function buildDateRange(
  startDateStr?: string,
  endDateStr?: string,
  daysAhead = 7,
): { start: Date; end: Date } {
  const start = startDateStr ? new Date(startDateStr) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = endDateStr
    ? new Date(endDateStr)
    : new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

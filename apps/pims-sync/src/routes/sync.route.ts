/**
 * Sync Routes
 *
 * API routes for triggering PIMS sync operations.
 * Uses domain sync services with IDEXX provider.
 *
 * Endpoint naming convention:
 * - /api/sync/outbound/*  - For Outbound Dashboard (Discharge Calls)
 * - /api/sync/inbound/*   - For Inbound Dashboard (VAPI Scheduling)
 * - /api/sync/reconcile   - Shared cleanup utility
 *
 * Endpoints:
 * - POST /api/sync/outbound/cases   - Pull appointments from PIMS, create cases
 * - POST /api/sync/outbound/enrich  - Add consultation data + AI pipeline
 * - POST /api/sync/outbound/full    - Complete outbound workflow (cases + enrich + reconcile)
 * - POST /api/sync/inbound/schedule - Generate VAPI availability slots
 * - POST /api/sync/reconcile        - 7-day historical reconciliation
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

// ============================================================================
// OUTBOUND ENDPOINTS - For Outbound Dashboard (Discharge Calls)
// ============================================================================

/**
 * POST /api/sync/outbound/cases
 *
 * Pull appointments from PIMS and create cases in Supabase.
 * Creates or updates case records based on appointments.
 */
syncRouter.post("/outbound/cases", (req: Request, res: Response) => {
  void handleOutboundCasesSync(req as AuthenticatedRequest, res);
});

/**
 * POST /api/sync/outbound/enrich
 *
 * Enrich cases with consultation data from PIMS.
 * Fetches SOAP notes, discharge summaries, and runs AI pipeline.
 */
syncRouter.post("/outbound/enrich", (req: Request, res: Response) => {
  void handleOutboundEnrichSync(req as AuthenticatedRequest, res);
});

/**
 * POST /api/sync/outbound/full
 *
 * Run complete outbound workflow:
 * 1. Cases sync (pull appointments)
 * 2. Enrich sync (consultation data + AI)
 * 3. Reconciliation (7-day cleanup)
 */
syncRouter.post("/outbound/full", (req: Request, res: Response) => {
  void handleOutboundFullSync(req as AuthenticatedRequest, res);
});

// ============================================================================
// INBOUND ENDPOINTS - For Inbound Dashboard (VAPI Scheduling)
// ============================================================================

/**
 * POST /api/sync/inbound/schedule
 *
 * Generate schedule availability slots based on clinic business hours.
 * Does not require PIMS browser - uses clinic config from database.
 */
syncRouter.post("/inbound/schedule", (req: Request, res: Response) => {
  void handleInboundScheduleSync(req as AuthenticatedRequest, res);
});

/**
 * POST /api/sync/inbound/appointments
 *
 * Sync appointments from IDEXX Neo to update schedule availability.
 * Fetches appointments from PIMS, upserts to schedule_appointments,
 * and updates schedule_slots.booked_count for accurate VAPI availability.
 */
syncRouter.post("/inbound/appointments", (req: Request, res: Response) => {
  void handleInboundAppointmentSync(req as AuthenticatedRequest, res);
});

// ============================================================================
// SHARED ENDPOINTS
// ============================================================================

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
 * Request body types
 */

// Outbound sync request types
interface OutboundCasesRequest {
  /** Clinic ID to sync (overrides API key clinic if provided) */
  clinicId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  daysAhead?: number;
  /** Alternative nested format for date range */
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface OutboundEnrichRequest {
  /** Clinic ID to sync (overrides API key clinic if provided) */
  clinicId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  parallelBatchSize?: number;
  /** Alternative nested format for date range */
  dateRange?: {
    start?: string;
    end?: string;
  };
}

interface OutboundFullRequest {
  /** Clinic ID to sync (overrides API key clinic if provided) */
  clinicId?: string;
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

// Inbound sync request types
interface InboundScheduleRequest {
  /** Clinic ID to sync (overrides API key clinic if provided) */
  clinicId?: string;
  /** Start date for slot generation (default: today) */
  startDate?: string;
  /** End date for slot generation (default: 30 days from start) */
  endDate?: string;
  /** Number of days ahead to generate (alternative to endDate, default: 30) */
  daysAhead?: number;
  /** Slot duration in minutes (default: 15) */
  slotDurationMinutes?: number;
  /** Default capacity per slot (default: 2) */
  defaultCapacity?: number;
}

interface InboundAppointmentRequest {
  /** Clinic ID to sync (overrides API key clinic if provided) */
  clinicId?: string;
  /** Start date for appointment sync (default: today) */
  startDate?: string;
  /** End date for appointment sync (default: daysAhead from start) */
  endDate?: string;
  /** Number of days ahead to sync (default: 7) */
  daysAhead?: number;
}

// Shared request types
interface ReconciliationRequest {
  /** Clinic ID to sync (overrides API key clinic if provided) */
  clinicId?: string;
  lookbackDays?: number;
}

interface BusinessHours {
  open: string;
  close: string;
  lunch_start?: string;
  lunch_end?: string;
}

interface BusinessHoursConfig {
  monday?: BusinessHours;
  tuesday?: BusinessHours;
  wednesday?: BusinessHours;
  thursday?: BusinessHours;
  friday?: BusinessHours;
  saturday?: BusinessHours;
  sunday?: BusinessHours;
}

/**
 * Handle outbound cases sync request
 * Pulls appointments from PIMS and creates cases in Supabase
 */
async function handleOutboundCasesSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as OutboundCasesRequest;

  // Resolve clinic ID: prefer body, fallback to middleware
  const clinicId = body.clinicId ?? clinic.id;

  if (!clinicId) {
    res.status(400).json({
      success: false,
      error:
        "Missing clinic ID - provide clinicId in request body or ensure API key is associated with a clinic",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info("Starting outbound cases sync", { clinicId });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup } =
      await createProviderForClinic(clinicId);

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
      const syncService = new InboundSyncService(supabase, provider, clinicId);

      // Build date range - support both flat (startDate/endDate) and nested (dateRange.start/end) formats
      const dateRange = buildDateRange(
        body.startDate ?? body.dateRange?.start,
        body.endDate ?? body.dateRange?.end,
        body.daysAhead ?? 7,
      );

      // Run sync
      const result = await syncService.sync({ dateRange });

      logger.info("Outbound cases sync completed", {
        clinicId,
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
    logger.error("Outbound cases sync failed", {
      clinicId,
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
 * Handle outbound enrich sync request
 * Adds consultation data and runs AI pipeline
 */
async function handleOutboundEnrichSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as OutboundEnrichRequest;

  // Resolve clinic ID: prefer body, fallback to middleware
  const clinicId = body.clinicId ?? clinic.id;

  if (!clinicId) {
    res.status(400).json({
      success: false,
      error:
        "Missing clinic ID - provide clinicId in request body or ensure API key is associated with a clinic",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info("Starting outbound enrich sync", { clinicId });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup, userId } =
      await createProviderForClinic(clinicId);

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
      const syncService = new CaseSyncService(
        supabase,
        provider,
        clinicId,
        userId,
      );

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

      logger.info("Outbound enrich sync completed", {
        clinicId,
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

      // Verify Supabase connectivity after browser cleanup
      const { testSupabaseConnection } = await import("../lib/supabase");
      const health = await testSupabaseConnection();
      if (!health.success) {
        logger.warn("Supabase health check failed after browser cleanup", {
          clinicId,
          error: health.error,
        });
      } else {
        logger.debug("Supabase health check passed after browser cleanup", {
          clinicId,
          latencyMs: health.latencyMs,
        });
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Outbound enrich sync failed", {
      clinicId,
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
 * Handle reconciliation request (shared utility)
 */
async function handleReconciliation(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as ReconciliationRequest;

  // Resolve clinic ID: prefer body, fallback to middleware
  const clinicId = body.clinicId ?? clinic.id;

  if (!clinicId) {
    res.status(400).json({
      success: false,
      error:
        "Missing clinic ID - provide clinicId in request body or ensure API key is associated with a clinic",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info("Starting reconciliation", { clinicId });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup } =
      await createProviderForClinic(clinicId);

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
      const reconciler = new CaseReconciler(supabase, provider, clinicId);

      // Run reconciliation
      const result = await reconciler.reconcile({
        lookbackDays: body.lookbackDays,
      });

      logger.info("Reconciliation completed", {
        clinicId,
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
      clinicId,
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
 * Handle outbound full sync request
 * Complete outbound workflow: cases + enrich + reconcile
 */
async function handleOutboundFullSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as OutboundFullRequest;

  // Resolve clinic ID: prefer body, fallback to middleware
  const clinicId = body.clinicId ?? clinic.id;

  if (!clinicId) {
    res.status(400).json({
      success: false,
      error:
        "Missing clinic ID - provide clinicId in request body or ensure API key is associated with a clinic",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info("Starting outbound full sync", { clinicId });

  try {
    // Get provider and credentials
    const { provider, credentials, cleanup, userId } =
      await createProviderForClinic(clinicId);

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
      const orchestrator = new SyncOrchestrator(
        supabase,
        provider,
        clinicId,
        userId,
      );

      // Use bidirectional sync if requested (default: true for comprehensive sync)
      const useBidirectional = body.bidirectional ?? true;

      let result;

      if (useBidirectional) {
        // Bidirectional sync: backward (past cases) + forward (future appointments)
        const backwardDays = body.backwardDays ?? body.lookbackDays ?? 14;
        const forwardDays = body.forwardDays ?? body.daysAhead ?? 14;

        logger.info("Running bidirectional sync", {
          clinicId,
          backwardDays,
          forwardDays,
        });

        result = await orchestrator.runBidirectionalSync({
          lookbackDays: backwardDays,
          forwardDays: forwardDays,
          reconciliationLookbackDays: 7,
        });

        logger.info("Outbound full sync (bidirectional) completed", {
          clinicId,
          phases: {
            backwardCases: result.backwardInbound?.success,
            forwardCases: result.forwardInbound?.success,
            enrich: result.cases?.success,
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

        logger.info("Running outbound full sync (forward-only)", {
          clinicId,
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

        logger.info("Outbound full sync completed", {
          clinicId,
          phases: {
            cases: result.inbound?.success,
            enrich: result.cases?.success,
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

      // Verify Supabase connectivity after browser cleanup
      const { testSupabaseConnection } = await import("../lib/supabase");
      const health = await testSupabaseConnection();
      if (!health.success) {
        logger.warn("Supabase health check failed after browser cleanup", {
          clinicId,
          error: health.error,
        });
      } else {
        logger.debug("Supabase health check passed after browser cleanup", {
          clinicId,
          latencyMs: health.latencyMs,
        });
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Outbound full sync failed", {
      clinicId,
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

/**
 * Handle inbound schedule sync request
 *
 * Generates VAPI availability slots based on clinic business hours.
 * Does not require PIMS browser authentication.
 */
async function handleInboundScheduleSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as InboundScheduleRequest;

  // Resolve clinic ID: prefer body, fallback to middleware
  const clinicId = body.clinicId ?? clinic.id;

  if (!clinicId) {
    res.status(400).json({
      success: false,
      error:
        "Missing clinic ID - provide clinicId in request body or ensure API key is associated with a clinic",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info("Starting inbound schedule sync", { clinicId });

  try {
    const supabase = createSupabaseServiceClient();

    // Get clinic config including business hours
    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select("name, timezone, business_hours")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinicData) {
      res.status(404).json({
        success: false,
        error: `Clinic not found: ${clinicId}`,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!clinicData.business_hours) {
      res.status(400).json({
        success: false,
        error: "Clinic does not have business hours configured",
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const businessHours = clinicData.business_hours as BusinessHoursConfig;
    const timezone = clinicData.timezone ?? "America/Los_Angeles";
    const slotDurationMinutes = body.slotDurationMinutes ?? 15;
    const defaultCapacity = body.defaultCapacity ?? 2;

    // Build date range
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const daysAhead = body.daysAhead ?? 30;
    const endDate = body.endDate
      ? new Date(body.endDate)
      : new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    // Generate slots
    const slots = generateScheduleSlots({
      clinicId,
      startDate,
      endDate,
      businessHours,
      slotDurationMinutes,
      defaultCapacity,
    });

    if (slots.length === 0) {
      res.status(200).json({
        success: true,
        message: "No slots to generate (no business hours for date range)",
        stats: {
          daysProcessed: 0,
          slotsGenerated: 0,
        },
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Insert slots in batches (Supabase has limits)
    const batchSize = 500;
    let totalInserted = 0;
    let totalSkipped = 0;

    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from("schedule_slots")
        .upsert(batch, {
          onConflict: "clinic_id,date,start_time",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        logger.error("Failed to insert schedule slots batch", {
          clinicId,
          batchIndex: i,
          error: error.message,
        });
        throw error;
      }

      totalInserted += data?.length ?? 0;
      totalSkipped += batch.length - (data?.length ?? 0);
    }

    // Record sync in schedule_syncs table
    const startDateStr = startDate.toISOString().split("T")[0]!;
    const endDateStr = endDate.toISOString().split("T")[0]!;
    await supabase.from("schedule_syncs").insert({
      clinic_id: clinicId,
      sync_start_date: startDateStr,
      sync_end_date: endDateStr,
      status: "completed",
      slots_created: totalInserted,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });

    logger.info("Inbound schedule sync completed", {
      clinicId,
      clinicName: clinicData.name,
      timezone,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      stats: {
        totalGenerated: slots.length,
        inserted: totalInserted,
        skipped: totalSkipped,
      },
      durationMs: Date.now() - startTime,
    });

    res.status(200).json({
      success: true,
      message: `Generated ${totalInserted} schedule slots`,
      clinic: {
        id: clinicId,
        name: clinicData.name,
        timezone,
      },
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      stats: {
        totalGenerated: slots.length,
        inserted: totalInserted,
        skipped: totalSkipped,
        slotDurationMinutes,
        defaultCapacity,
      },
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Inbound schedule sync failed", {
      clinicId,
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
 * Generate schedule slots for a date range based on business hours
 */
function generateScheduleSlots(options: {
  clinicId: string;
  startDate: Date;
  endDate: Date;
  businessHours: BusinessHoursConfig;
  slotDurationMinutes: number;
  defaultCapacity: number;
}): Array<{
  clinic_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  last_synced_at: string;
}> {
  const {
    clinicId,
    startDate,
    endDate,
    businessHours,
    slotDurationMinutes,
    defaultCapacity,
  } = options;

  const slots: Array<{
    clinic_id: string;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booked_count: number;
    last_synced_at: string;
  }> = [];

  const dayNames: Array<keyof BusinessHoursConfig> = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const now = new Date().toISOString();
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const dayName = dayNames[dayOfWeek]!;
    const dayHours = businessHours[dayName];

    if (dayHours?.open && dayHours?.close) {
      const dateStr = currentDate.toISOString().split("T")[0]!;

      // Parse times (format: "HH:MM")
      const openParts = dayHours.open.split(":");
      const openHour = parseInt(openParts[0] ?? "0", 10);
      const openMin = parseInt(openParts[1] ?? "0", 10);

      const closeParts = dayHours.close.split(":");
      const closeHour = parseInt(closeParts[0] ?? "0", 10);
      const closeMin = parseInt(closeParts[1] ?? "0", 10);

      // Parse lunch times if present
      let lunchStartMinutes: number | null = null;
      let lunchEndMinutes: number | null = null;

      if (dayHours.lunch_start && dayHours.lunch_end) {
        const lunchStartParts = dayHours.lunch_start.split(":");
        const lunchStartHour = parseInt(lunchStartParts[0] ?? "0", 10);
        const lunchStartMin = parseInt(lunchStartParts[1] ?? "0", 10);

        const lunchEndParts = dayHours.lunch_end.split(":");
        const lunchEndHour = parseInt(lunchEndParts[0] ?? "0", 10);
        const lunchEndMin = parseInt(lunchEndParts[1] ?? "0", 10);

        lunchStartMinutes = lunchStartHour * 60 + lunchStartMin;
        lunchEndMinutes = lunchEndHour * 60 + lunchEndMin;
      }

      // Generate slots
      let currentMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      while (currentMinutes + slotDurationMinutes <= closeMinutes) {
        // Skip lunch period
        if (
          lunchStartMinutes !== null &&
          lunchEndMinutes !== null &&
          currentMinutes >= lunchStartMinutes &&
          currentMinutes < lunchEndMinutes
        ) {
          currentMinutes = lunchEndMinutes;
          continue;
        }

        const slotStartHour = Math.floor(currentMinutes / 60);
        const slotStartMin = currentMinutes % 60;
        const slotEndMinutes = currentMinutes + slotDurationMinutes;
        const slotEndHour = Math.floor(slotEndMinutes / 60);
        const slotEndMin = slotEndMinutes % 60;

        // Don't create slots that would overlap with lunch
        if (
          lunchStartMinutes !== null &&
          lunchEndMinutes !== null &&
          currentMinutes < lunchStartMinutes &&
          slotEndMinutes > lunchStartMinutes
        ) {
          currentMinutes += slotDurationMinutes;
          continue;
        }

        slots.push({
          clinic_id: clinicId,
          date: dateStr,
          start_time: `${String(slotStartHour).padStart(2, "0")}:${String(slotStartMin).padStart(2, "0")}:00`,
          end_time: `${String(slotEndHour).padStart(2, "0")}:${String(slotEndMin).padStart(2, "0")}:00`,
          capacity: defaultCapacity,
          booked_count: 0,
          last_synced_at: now,
        });

        currentMinutes += slotDurationMinutes;
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return slots;
}

/**
 * Handle inbound appointment sync request
 *
 * Syncs appointments from IDEXX Neo to update schedule availability.
 * This ensures that schedule_slots.booked_count reflects actual appointments.
 */
async function handleInboundAppointmentSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as InboundAppointmentRequest;

  // Resolve clinic ID: prefer body, fallback to middleware
  const clinicId = body.clinicId ?? clinic.id;

  if (!clinicId) {
    res.status(400).json({
      success: false,
      error:
        "Missing clinic ID - provide clinicId in request body or ensure API key is associated with a clinic",
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.info("Starting inbound appointment sync", { clinicId });

  let syncId: string | null = null;

  try {
    const supabase = createSupabaseServiceClient();

    // Build date range
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const daysAhead = body.daysAhead ?? 7;
    const endDate = body.endDate
      ? new Date(body.endDate)
      : new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    endDate.setHours(23, 59, 59, 999);

    const startDateStr = startDate.toISOString().split("T")[0]!;
    const endDateStr = endDate.toISOString().split("T")[0]!;

    // Create sync record
    const { data: syncRecord, error: syncError } = await supabase
      .from("schedule_syncs")
      .insert({
        clinic_id: clinicId,
        sync_start_date: startDateStr,
        sync_end_date: endDateStr,
        sync_type: "appointments",
        status: "in_progress",
        started_at: new Date(startTime).toISOString(),
      })
      .select("id")
      .single();

    if (syncError) {
      logger.error("Failed to create sync record", {
        clinicId,
        error: syncError.message,
      });
    } else {
      syncId = syncRecord.id;
    }

    // Get provider and authenticate
    const { provider, credentials, cleanup } =
      await createProviderForClinic(clinicId);

    try {
      // Authenticate with PIMS
      const authenticated = await provider.authenticate(credentials);
      if (!authenticated) {
        // Update sync record with failure
        if (syncId) {
          await supabase
            .from("schedule_syncs")
            .update({
              status: "failed",
              error_message: "PIMS authentication failed",
              completed_at: new Date().toISOString(),
              duration_ms: Date.now() - startTime,
            })
            .eq("id", syncId);
        }

        res.status(401).json({
          success: false,
          error: "PIMS authentication failed",
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Fetch appointments from IDEXX
      logger.info("Fetching appointments from IDEXX", {
        clinicId,
        dateRange: { start: startDateStr, end: endDateStr },
      });

      const appointments = await provider.fetchAppointments(startDate, endDate);

      logger.info("Fetched appointments from IDEXX", {
        clinicId,
        appointmentCount: appointments.length,
      });

      // Upsert appointments to schedule_appointments table
      let appointmentsAdded = 0;
      const appointmentsUpdated = 0; // Reserved for future use when detecting actual updates vs inserts
      let appointmentsRemoved = 0;

      if (appointments.length > 0) {
        // Convert PIMS appointments to database format
        const appointmentRecords = appointments.map((appt) => {
          // Parse the startTime to extract time string
          let timeStr = "00:00:00";
          let endTimeStr = "00:00:00";

          if (appt.startTime) {
            const hours = String(appt.startTime.getHours()).padStart(2, "0");
            const minutes = String(appt.startTime.getMinutes()).padStart(
              2,
              "0",
            );
            timeStr = `${hours}:${minutes}:00`;

            // Calculate end time from duration (default 15 minutes)
            const durationMs = (appt.duration ?? 15) * 60 * 1000;
            const endTime = new Date(appt.startTime.getTime() + durationMs);
            const endHours = String(endTime.getHours()).padStart(2, "0");
            const endMinutes = String(endTime.getMinutes()).padStart(2, "0");
            endTimeStr = `${endHours}:${endMinutes}:00`;
          }

          return {
            clinic_id: clinicId,
            neo_appointment_id: appt.id,
            date: appt.date,
            start_time: timeStr,
            end_time: endTimeStr,
            patient_name: appt.patient?.name ?? null,
            client_name: appt.client?.name ?? null,
            client_phone: appt.client?.phone ?? null,
            provider_name: appt.provider?.name ?? null,
            room_id: appt.provider?.id ?? null,
            appointment_type: appt.type ?? null,
            status: mapAppointmentStatus(appt.status),
            last_synced_at: new Date().toISOString(),
            deleted_at: null, // Clear soft delete if re-synced
          };
        });

        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < appointmentRecords.length; i += batchSize) {
          const batch = appointmentRecords.slice(i, i + batchSize);
          const { error: upsertError } = await supabase
            .from("schedule_appointments")
            .upsert(batch, {
              onConflict: "clinic_id,neo_appointment_id",
            });

          if (upsertError) {
            logger.error("Failed to upsert appointments batch", {
              clinicId,
              batchIndex: i,
              error: upsertError.message,
            });
          } else {
            appointmentsAdded += batch.length;
          }
        }

        // Soft-delete appointments that weren't in this sync
        // (appointments that existed in DB but not returned by IDEXX)
        const syncedIds = appointments.map((a) => a.id);
        const { data: removedData, error: removeError } = await supabase
          .from("schedule_appointments")
          .update({
            deleted_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
          })
          .eq("clinic_id", clinicId)
          .gte("date", startDateStr)
          .lte("date", endDateStr)
          .is("deleted_at", null)
          .not(
            "neo_appointment_id",
            "in",
            `(${syncedIds.map((id) => `'${id}'`).join(",")})`,
          )
          .select("id");

        if (removeError) {
          logger.warn("Failed to soft-delete stale appointments", {
            clinicId,
            error: removeError.message,
          });
        } else {
          appointmentsRemoved = removedData?.length ?? 0;
        }
      }

      // Call PostgreSQL function to update booked_count in schedule_slots
      logger.info("Updating slot booked counts", {
        clinicId,
        dateRange: { start: startDateStr, end: endDateStr },
      });

      const { data: updateResult, error: updateError } = (await supabase.rpc(
        "update_slot_booked_counts",
        {
          p_clinic_id: clinicId,
          p_start_date: startDateStr,
          p_end_date: endDateStr,
        },
      )) as {
        data: { slots_updated: number; total_appointments: number }[] | null;
        error: Error | null;
      };

      let slotsUpdated = 0;
      if (updateError) {
        logger.error("Failed to update slot booked counts", {
          clinicId,
          error: updateError.message,
        });
      } else if (updateResult && updateResult.length > 0) {
        slotsUpdated = updateResult[0]?.slots_updated ?? 0;
        logger.info("Updated slot booked counts", {
          clinicId,
          slotsUpdated,
          totalAppointments: updateResult[0]?.total_appointments ?? 0,
        });
      }

      // Update sync record with success
      if (syncId) {
        await supabase
          .from("schedule_syncs")
          .update({
            status: "completed",
            appointments_added: appointmentsAdded,
            appointments_updated: appointmentsUpdated,
            appointments_removed: appointmentsRemoved,
            slots_updated: slotsUpdated,
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
          })
          .eq("id", syncId);
      }

      logger.info("Inbound appointment sync completed", {
        clinicId,
        syncId,
        dateRange: { start: startDateStr, end: endDateStr },
        stats: {
          appointmentsFound: appointments.length,
          appointmentsAdded,
          appointmentsUpdated,
          appointmentsRemoved,
          slotsUpdated,
        },
        durationMs: Date.now() - startTime,
      });

      res.status(200).json({
        success: true,
        syncId,
        message: `Synced ${appointments.length} appointments, updated ${slotsUpdated} slots`,
        clinic: { id: clinicId },
        dateRange: { start: startDateStr, end: endDateStr },
        stats: {
          appointmentsFound: appointments.length,
          appointmentsAdded,
          appointmentsUpdated,
          appointmentsRemoved,
          slotsUpdated,
        },
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    } finally {
      await cleanup();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Inbound appointment sync failed", {
      clinicId,
      syncId,
      error: errorMessage,
    });

    // Update sync record with failure
    if (syncId) {
      const supabase = createSupabaseServiceClient();
      await supabase
        .from("schedule_syncs")
        .update({
          status: "failed",
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        })
        .eq("id", syncId);
    }

    res.status(500).json({
      success: false,
      syncId,
      error: errorMessage,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Map PIMS appointment status to standardized status
 */
function mapAppointmentStatus(status: string | null | undefined): string {
  if (!status) return "scheduled";

  const statusLower = status.toLowerCase();

  if (
    statusLower.includes("cancel") ||
    statusLower === "cancelled" ||
    statusLower === "canceled"
  ) {
    return "cancelled";
  }
  if (
    statusLower.includes("no show") ||
    statusLower === "no_show" ||
    statusLower === "noshow"
  ) {
    return "no_show";
  }
  if (
    statusLower.includes("final") ||
    statusLower === "finalized" ||
    statusLower === "complete" ||
    statusLower === "completed"
  ) {
    return "finalized";
  }
  if (
    statusLower.includes("progress") ||
    statusLower === "in_progress" ||
    statusLower === "checked_in"
  ) {
    return "in_progress";
  }

  return "scheduled";
}

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
 * POST /api/sync/schedule-slots
 *
 * Generate schedule availability slots based on clinic business hours.
 * Does not require PIMS browser - uses clinic config from database.
 */
syncRouter.post("/schedule-slots", (req: Request, res: Response) => {
  void handleScheduleSlotsSync(req as AuthenticatedRequest, res);
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

interface ScheduleSlotsRequest {
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
    const { provider, credentials, cleanup, userId } =
      await createProviderForClinic(clinic.id);

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
        clinic.id,
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
    const { provider, credentials, cleanup, userId } =
      await createProviderForClinic(clinic.id);

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
        clinic.id,
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

/**
 * Handle schedule slots sync request
 *
 * Generates availability slots based on clinic business hours.
 * Does not require PIMS browser authentication.
 */
async function handleScheduleSlotsSync(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const startTime = Date.now();
  const { clinic } = req;
  const body = req.body as ScheduleSlotsRequest;

  logger.info("Starting schedule slots sync", { clinicId: clinic.id });

  try {
    const supabase = createSupabaseServiceClient();

    // Get clinic config including business hours
    const { data: clinicData, error: clinicError } = await supabase
      .from("clinics")
      .select("name, timezone, business_hours")
      .eq("id", clinic.id)
      .single();

    if (clinicError || !clinicData) {
      res.status(404).json({
        success: false,
        error: `Clinic not found: ${clinic.id}`,
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
      clinicId: clinic.id,
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
          clinicId: clinic.id,
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
      clinic_id: clinic.id,
      sync_start_date: startDateStr,
      sync_end_date: endDateStr,
      status: "completed",
      slots_created: totalInserted,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    });

    logger.info("Schedule slots sync completed", {
      clinicId: clinic.id,
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
        id: clinic.id,
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
    logger.error("Schedule slots sync failed", {
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

/**
 * Schedule Sync Route
 *
 * POST /api/idexx/schedule-sync - Sync schedule for next N days
 *
 * This endpoint syncs the IDEXX Neo schedule into Supabase so that
 * VAPI can access fresh availability data via the check_availability tool.
 *
 * Data flow:
 * 1. IDEXX API → schedule_appointments (booked appointments)
 * 2. Clinic config → schedule_slots (available time slots)
 * 3. VAPI → get_available_slots() function → reads from both tables
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { scheduleLogger as logger } from "../lib/logger";
import { BrowserService } from "../services/browser.service";
import { AuthService } from "../services/auth.service";
import { PersistenceService } from "../services/persistence.service";
import { ScheduleSyncService } from "../services/schedule-sync.service";

export const scheduleSyncRouter: ReturnType<typeof Router> = Router();

/**
 * Request body for schedule sync
 */
interface ScheduleSyncRequest {
  clinicId: string;
  daysAhead?: number; // Number of days to sync (default: 14)
}

/**
 * Response for schedule sync
 */
interface ScheduleSyncResponse {
  success: boolean;
  syncId?: string;
  stats?: {
    slotsCreated: number;
    slotsUpdated: number;
    appointmentsAdded: number;
    appointmentsUpdated: number;
    appointmentsRemoved: number;
    conflictsDetected: number;
    conflictsResolved: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  syncedAt: string; // ISO timestamp of when sync completed
  nextStaleAt?: string; // ISO timestamp when data becomes stale
  errors: string[];
  durationMs: number;
  timestamp: string;
}

/**
 * POST /api/idexx/schedule-sync
 *
 * Syncs the schedule for a clinic for the next N days (default 14).
 * This creates/updates schedule_slots and schedule_appointments tables
 * which are used by the VAPI check_availability tool.
 */
scheduleSyncRouter.post("/schedule-sync", (req: Request, res: Response) => {
  void handleScheduleSync(req, res);
});

/**
 * GET /api/idexx/schedule-sync/status
 *
 * Check sync freshness for a clinic without triggering a new sync.
 * Useful for VAPI/dashboard to know if schedule data is stale.
 */
scheduleSyncRouter.get(
  "/schedule-sync/status",
  (req: Request, res: Response) => {
    void handleSyncStatus(req, res);
  },
);

async function handleSyncStatus(req: Request, res: Response): Promise<void> {
  const clinicId = req.query.clinicId as string;

  if (!clinicId) {
    res.status(400).json({
      error: "Missing 'clinicId' query parameter",
    });
    return;
  }

  const persistence = new PersistenceService();

  try {
    const clinic = await persistence.getClinic(clinicId);
    if (!clinic) {
      res.status(404).json({ error: `Clinic not found: ${clinicId}` });
      return;
    }

    // Query latest sync for this clinic from schedule_syncs table
    const { createServiceClient } = await import("@odis-ai/data-access/db");
    const supabase = await createServiceClient();

    const { data: latestSync } = await supabase
      .from("schedule_syncs")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: config } = await supabase
      .from("clinic_schedule_config")
      .select("stale_threshold_minutes, sync_horizon_days")
      .eq("clinic_id", clinicId)
      .maybeSingle();

    const staleThresholdMinutes = config?.stale_threshold_minutes ?? 60;
    const syncHorizonDays = config?.sync_horizon_days ?? 14;

    if (!latestSync) {
      res.json({
        clinicId,
        clinicName: clinic.name,
        hasData: false,
        isStale: true,
        message:
          "No schedule sync has been performed. Run a sync to populate availability data.",
        recommendedAction: "POST /api/idexx/schedule-sync",
      });
      return;
    }

    const syncedAt = new Date(latestSync.completed_at);
    const now = new Date();
    const minutesSinceSync = (now.getTime() - syncedAt.getTime()) / (1000 * 60);
    const isStale = minutesSinceSync > staleThresholdMinutes;

    const nextStaleAt = new Date(
      syncedAt.getTime() + staleThresholdMinutes * 60 * 1000,
    );

    res.json({
      clinicId,
      clinicName: clinic.name,
      hasData: true,
      isStale,
      lastSync: {
        id: latestSync.id,
        completedAt: latestSync.completed_at,
        dateRange: {
          start: latestSync.sync_start_date,
          end: latestSync.sync_end_date,
        },
        stats: {
          slotsCreated: latestSync.slots_created,
          appointmentsAdded: latestSync.appointments_added,
          appointmentsUpdated: latestSync.appointments_updated,
          appointmentsRemoved: latestSync.appointments_removed,
        },
        durationMs: latestSync.duration_ms,
      },
      freshness: {
        syncedAt: syncedAt.toISOString(),
        nextStaleAt: nextStaleAt.toISOString(),
        minutesSinceSync: Math.round(minutesSinceSync),
        staleThresholdMinutes,
        syncHorizonDays,
      },
      message: isStale
        ? `Schedule data is stale (last synced ${Math.round(minutesSinceSync)} minutes ago). Consider running a fresh sync.`
        : `Schedule data is fresh. Last synced ${Math.round(minutesSinceSync)} minutes ago.`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Failed to check sync status: ${msg}`);
    res.status(500).json({ error: msg });
  }
}

async function handleScheduleSync(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const body = req.body as Partial<ScheduleSyncRequest>;

  // Validate request
  const { clinicId, daysAhead = 14 } = body;

  if (!clinicId || typeof clinicId !== "string") {
    res.status(400).json({
      success: false,
      errors: ["Missing or invalid 'clinicId'. Must be a valid UUID string."],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    } as ScheduleSyncResponse);
    return;
  }

  if (daysAhead < 1 || daysAhead > 60) {
    res.status(400).json({
      success: false,
      errors: ["'daysAhead' must be between 1 and 60."],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    } as ScheduleSyncResponse);
    return;
  }

  logger.info(
    `Starting schedule sync for clinic ${clinicId}, ${daysAhead} days ahead`,
  );

  const browser = new BrowserService();
  const auth = new AuthService(browser);
  const persistence = new PersistenceService();
  const scheduleSync = new ScheduleSyncService(browser);

  try {
    // 1. Validate clinic exists
    const clinic = await persistence.getClinic(clinicId);
    if (!clinic) {
      res.status(404).json({
        success: false,
        errors: [`Clinic not found: ${clinicId}`],
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      } as ScheduleSyncResponse);
      return;
    }

    logger.info(`Syncing schedule for clinic: ${clinic.name}`);

    // 2. Get credentials
    const credentialResult = await persistence.getClinicCredentials(clinicId);
    if (!credentialResult) {
      res.status(401).json({
        success: false,
        errors: [`No credentials found for clinic: ${clinic.name}`],
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      } as ScheduleSyncResponse);
      return;
    }

    const { credentials } = credentialResult;

    // 3. Calculate date range
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysAhead);
    endDate.setHours(23, 59, 59, 999);

    try {
      // 4. Launch browser and login
      await browser.launch();
      const page = await browser.newPage();

      const loginSuccess = await auth.login(page, credentials);
      if (!loginSuccess) {
        res.status(401).json({
          success: false,
          errors: [`Login failed for clinic: ${clinic.name}`],
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        } as ScheduleSyncResponse);
        return;
      }

      // 5. Run schedule sync
      const result = await scheduleSync.syncSchedule(page, {
        clinicId,
        dateRange: { start: startDate, end: endDate },
      });

      // 6. Build response with sync freshness info
      const syncedAt = new Date();
      const staleThresholdMinutes = 60; // Default, matches clinic_schedule_config
      const nextStaleAt = new Date(
        syncedAt.getTime() + staleThresholdMinutes * 60 * 1000,
      );

      const response: ScheduleSyncResponse = {
        success: result.success,
        syncId: result.syncId,
        stats: result.stats,
        dateRange: {
          start: startDate.toISOString().split("T")[0] ?? "",
          end: endDate.toISOString().split("T")[0] ?? "",
        },
        syncedAt: syncedAt.toISOString(),
        nextStaleAt: nextStaleAt.toISOString(),
        errors: result.errors,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      logger.info(
        `Schedule sync completed for ${clinic.name}: ` +
          `${result.stats.slotsCreated} slots created, ` +
          `${result.stats.appointmentsAdded} added, ` +
          `${result.stats.appointmentsUpdated} updated, ` +
          `${result.stats.appointmentsRemoved} removed (reconciled)`,
      );

      res.status(result.success ? 200 : 500).json(response);
    } finally {
      await browser.close();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    logger.error(`Schedule sync failed: ${errorMessage}`);

    res.status(500).json({
      success: false,
      errors: [errorMessage],
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    } as ScheduleSyncResponse);
  }
}

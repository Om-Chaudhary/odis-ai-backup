/**
 * Sync Scheduler - Per-clinic cron scheduling for PIMS sync jobs
 */

import cron from "node-cron";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@odis-ai/shared/types";
import type { IPimsProvider } from "@odis-ai/domain/sync";
import { createLogger } from "@odis-ai/shared/logger";
import type { ClinicScheduleConfig } from "./config-loader";
import { loadClinicSchedules } from "./config-loader";

const logger = createLogger("scheduler:sync");

interface ScheduledJob {
  clinicId: string;
  clinicName: string;
  clinicTimezone: string;
  type: "inbound" | "cases" | "reconciliation";
  cron: string;
  task: cron.ScheduledTask;
}

/**
 * SyncScheduler - Manages per-clinic cron scheduling
 *
 * Responsibilities:
 * - Load clinic schedules from database
 * - Create cron jobs for each enabled schedule
 * - Poll for schedule config changes
 * - Execute sync operations on schedule
 * - Graceful shutdown (stop all jobs)
 */
export class SyncScheduler {
  private jobs: ScheduledJob[] = [];
  private configPollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private supabase: SupabaseClient<Database>,
    private providerFactory: (clinicId: string) => Promise<IPimsProvider>,
  ) {}

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("Scheduler already running");
      return;
    }

    logger.info("Starting sync scheduler...");
    this.isRunning = true;

    try {
      // Load initial schedules
      await this.loadAndScheduleJobs();

      // Poll for config changes every 5 minutes
      this.configPollInterval = setInterval(
        () => {
          this.reloadSchedules().catch((error) => {
            logger.error("Failed to reload schedules", {
              error: error instanceof Error ? error.message : "Unknown error",
            });
          });
        },
        5 * 60 * 1000,
      ); // 5 minutes

      logger.info("Sync scheduler started", {
        totalJobs: this.jobs.length,
        pollIntervalMs: 5 * 60 * 1000,
      });
    } catch (error) {
      logger.error("Failed to start scheduler", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info("Stopping sync scheduler...");

    // Stop config polling
    if (this.configPollInterval) {
      clearInterval(this.configPollInterval);
      this.configPollInterval = null;
    }

    // Stop all cron jobs
    for (const job of this.jobs) {
      job.task.stop();
      logger.debug("Stopped scheduled job", {
        clinicId: job.clinicId,
        clinicName: job.clinicName,
        type: job.type,
      });
    }

    this.jobs = [];
    this.isRunning = false;

    logger.info("Sync scheduler stopped");
  }

  /**
   * Get status of scheduled jobs
   */
  getStatus(): {
    running: boolean;
    totalJobs: number;
    jobsByType: Record<string, number>;
    jobs: Array<{
      clinicId: string;
      clinicName: string;
      clinicTimezone: string;
      type: string;
      cron: string;
    }>;
  } {
    const jobsByType = this.jobs.reduce(
      (acc, job) => {
        acc[job.type] = (acc[job.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      running: this.isRunning,
      totalJobs: this.jobs.length,
      jobsByType,
      jobs: this.jobs.map((job) => ({
        clinicId: job.clinicId,
        clinicName: job.clinicName,
        clinicTimezone: job.clinicTimezone,
        type: job.type,
        cron: job.cron,
      })),
    };
  }

  /**
   * Load schedules and create cron jobs
   */
  private async loadAndScheduleJobs(): Promise<void> {
    const configs = await loadClinicSchedules(this.supabase);

    for (const config of configs) {
      this.scheduleClinicJobs(config);
    }

    logger.info("Scheduled jobs created", {
      totalClinics: configs.length,
      totalJobs: this.jobs.length,
    });
  }

  /**
   * Reload schedules (poll for changes)
   */
  private async reloadSchedules(): Promise<void> {
    logger.debug("Reloading clinic schedules...");

    // Stop existing jobs
    for (const job of this.jobs) {
      job.task.stop();
    }
    this.jobs = [];

    // Reload and reschedule
    await this.loadAndScheduleJobs();

    logger.info("Schedules reloaded", { totalJobs: this.jobs.length });
  }

  /**
   * Schedule jobs for a clinic
   */
  private scheduleClinicJobs(config: ClinicScheduleConfig): void {
    for (const schedule of config.schedules) {
      if (!schedule.enabled) {
        logger.debug("Skipping disabled schedule", {
          clinicId: config.clinicId,
          type: schedule.type,
        });
        continue;
      }

      // Validate cron expression
      if (!cron.validate(schedule.cron)) {
        logger.error("Invalid cron expression, skipping", {
          clinicId: config.clinicId,
          type: schedule.type,
          cron: schedule.cron,
        });
        continue;
      }

      // Create cron task
      const task = cron.schedule(
        schedule.cron,
        () => {
          this.executeSyncJob(
            config.clinicId,
            config.clinicName,
            schedule.type,
          ).catch((error) => {
            logger.error("Sync job failed", {
              clinicId: config.clinicId,
              clinicName: config.clinicName,
              type: schedule.type,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          });
        },
        {
          scheduled: true,
          timezone: config.clinicTimezone,
        },
      );

      this.jobs.push({
        clinicId: config.clinicId,
        clinicName: config.clinicName,
        clinicTimezone: config.clinicTimezone,
        type: schedule.type,
        cron: schedule.cron,
        task,
      });

      logger.info("Scheduled sync job", {
        clinicId: config.clinicId,
        clinicName: config.clinicName,
        type: schedule.type,
        cron: schedule.cron,
      });
    }
  }

  /**
   * Execute a scheduled sync job
   */
  private async executeSyncJob(
    clinicId: string,
    clinicName: string,
    type: "inbound" | "cases" | "reconciliation",
  ): Promise<void> {
    const jobLogger = logger.child(`${type}-job`);

    jobLogger.info("Starting scheduled sync job", { clinicId, clinicName });

    try {
      const provider = await this.providerFactory(clinicId);

      switch (type) {
        case "inbound": {
          const { InboundSyncService } = await import("@odis-ai/domain/sync");
          const syncService = new InboundSyncService(
            this.supabase,
            provider,
            clinicId,
          );

          const result = await syncService.sync({
            dateRange: this.getDefaultDateRange(),
          });

          jobLogger.info("Inbound sync completed", {
            clinicId,
            clinicName,
            success: result.success,
            stats: result.stats,
            durationMs: result.durationMs,
          });
          break;
        }

        case "cases": {
          const { CaseSyncService } = await import("@odis-ai/domain/sync");
          const syncService = new CaseSyncService(
            this.supabase,
            provider,
            clinicId,
          );

          const { start, end } = this.getDefaultDateRange();
          const result = await syncService.sync({
            startDate: start,
            endDate: end,
            parallelBatchSize: 5,
          });

          jobLogger.info("Case sync completed", {
            clinicId,
            clinicName,
            success: result.success,
            stats: result.stats,
            durationMs: result.durationMs,
          });
          break;
        }

        case "reconciliation": {
          const { CaseReconciler } = await import("@odis-ai/domain/sync");
          const reconciler = new CaseReconciler(
            this.supabase,
            provider,
            clinicId,
          );

          const result = await reconciler.reconcile({ lookbackDays: 7 });

          jobLogger.info("Reconciliation completed", {
            clinicId,
            clinicName,
            success: result.success,
            stats: result.stats,
            durationMs: result.durationMs,
          });
          break;
        }
      }

      await provider.close();
    } catch (error) {
      jobLogger.error("Scheduled sync job failed", {
        clinicId,
        clinicName,
        type,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get default date range (today + next 7 days)
   */
  private getDefaultDateRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }
}

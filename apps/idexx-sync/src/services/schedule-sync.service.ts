/**
 * Schedule Sync Service
 *
 * Orchestrates the full schedule sync flow:
 * 1. Fetch IDEXX schedule config
 * 2. Store/update clinic config
 * 3. Generate slots for date range
 * 4. Fetch IDEXX appointments
 * 5. Reconcile appointments (add/update/remove)
 * 6. Update slot booked counts
 * 7. Detect and resolve conflicts
 */

import type { Page } from "playwright";
import { createServiceClient } from "@odis-ai/data-access/db";
import { scheduleLogger as logger } from "../lib/logger";
import { SlotGeneratorService } from "./slot-generator.service";
import { ReconciliationService } from "./reconciliation.service";
import { ScheduleScraper } from "../scrapers/schedule.scraper";
import type { BrowserService } from "./browser.service";
import type {
  ClinicScheduleConfig,
  BlockedPeriod,
  GeneratedSlot,
  ScheduleSyncResult,
  IdexxScheduleConfig,
  ReconciliationPlan,
} from "../types";

type SupabaseClient = Awaited<ReturnType<typeof createServiceClient>>;

/**
 * Sync options
 */
interface SyncOptions {
  clinicId: string;
  dateRange?: { start: Date; end: Date };
  forceFullSync?: boolean;
}

/**
 * Schedule Sync Service
 *
 * Main orchestrator for syncing IDEXX schedule data to the database.
 */
export class ScheduleSyncService {
  private supabase: SupabaseClient | null = null;
  private slotGenerator: SlotGeneratorService;
  private reconciliation: ReconciliationService;
  private scraper: ScheduleScraper;

  constructor(browser: BrowserService) {
    this.slotGenerator = new SlotGeneratorService();
    this.reconciliation = new ReconciliationService();
    this.scraper = new ScheduleScraper(browser);
  }

  /**
   * Get or create Supabase client
   */
  private async getClient(): Promise<SupabaseClient> {
    this.supabase ??= await createServiceClient();
    return this.supabase;
  }

  /**
   * Run full schedule sync for a clinic
   *
   * @param page - Authenticated Playwright page
   * @param options - Sync options
   * @returns Sync result with statistics
   */
  async syncSchedule(
    page: Page,
    options: SyncOptions,
  ): Promise<ScheduleSyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let syncId = "";

    const stats = {
      slotsCreated: 0,
      slotsUpdated: 0,
      appointmentsAdded: 0,
      appointmentsUpdated: 0,
      appointmentsRemoved: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
    };

    try {
      logger.info(`Starting schedule sync for clinic ${options.clinicId}`);

      // Step 1: Fetch IDEXX schedule config
      logger.debug("Fetching IDEXX schedule config...");
      const idexxConfig = await this.scraper.fetchScheduleConfig(page);

      // Step 2: Get/update clinic config in database
      const clinicConfig = await this.getOrCreateClinicConfig(
        options.clinicId,
        idexxConfig,
      );

      // Step 3: Get blocked periods
      const blockedPeriods = await this.getBlockedPeriods(options.clinicId);

      // Step 4: Calculate date range
      const dateRange =
        options.dateRange ?? this.slotGenerator.getDateRange(clinicConfig);

      // Step 5: Create sync session
      syncId = await this.createSyncSession(
        options.clinicId,
        dateRange,
        idexxConfig,
      );

      // Step 6: Generate slots for date range
      logger.debug(
        `Generating slots for ${dateRange.start.toISOString().split("T")[0]} to ${dateRange.end.toISOString().split("T")[0]}`,
      );
      const generatedSlots = this.slotGenerator.generateSlots(
        options.clinicId,
        clinicConfig,
        blockedPeriods,
        dateRange,
      );

      // Step 7: Upsert slots to database
      const slotStats = await this.upsertSlots(
        options.clinicId,
        generatedSlots,
        syncId,
      );
      stats.slotsCreated = slotStats.created;
      stats.slotsUpdated = slotStats.updated;

      // Step 8: Build slot map for appointment linking
      const slotMap = await this.buildSlotMap(options.clinicId, dateRange);

      // Step 9: Fetch and reconcile appointments for each date
      const currentDate = new Date(dateRange.start);
      while (currentDate <= dateRange.end) {
        const dateStr = currentDate.toISOString().split("T")[0] ?? "";

        try {
          // Scrape appointments for this date
          const scrapeResult = await this.scraper.scrape(page, dateStr);

          if (scrapeResult.errors.length > 0) {
            errors.push(...scrapeResult.errors);
          }

          // Get existing appointments for this date
          const existing = await this.getExistingAppointments(
            options.clinicId,
            dateStr,
          );

          // Build reconciliation plan
          const plans = this.reconciliation.buildReconciliationPlan(
            scrapeResult.appointments,
            existing,
          );

          const planStats = this.reconciliation.calculateStats(plans);
          this.reconciliation.logSummary(planStats);

          // Execute reconciliation
          const apptStats = await this.executeReconciliation(
            options.clinicId,
            dateStr,
            plans,
            slotMap,
            clinicConfig?.slot_duration_minutes ?? 15,
            syncId,
          );

          stats.appointmentsAdded += apptStats.added;
          stats.appointmentsUpdated += apptStats.updated;
          stats.appointmentsRemoved += apptStats.removed;

          // Update slot booked counts for this date
          await this.updateSlotBookedCounts(options.clinicId, dateStr);
        } catch (dateError) {
          const msg =
            dateError instanceof Error ? dateError.message : "Unknown error";
          errors.push(`Error syncing date ${dateStr}: ${msg}`);
          logger.error(`Error syncing date ${dateStr}: ${msg}`);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Step 10: Detect and resolve conflicts with VAPI bookings
      const conflictStats = await this.resolveConflicts(
        options.clinicId,
        dateRange,
      );
      stats.conflictsDetected = conflictStats.detected;
      stats.conflictsResolved = conflictStats.resolved;

      // Step 11: Complete sync session
      const durationMs = Date.now() - startTime;
      await this.completeSyncSession(syncId, stats, durationMs);

      logger.info(
        `Schedule sync completed in ${durationMs}ms: ` +
          `${stats.slotsCreated}/${stats.slotsUpdated} slots created/updated, ` +
          `${stats.appointmentsAdded}/${stats.appointmentsUpdated}/${stats.appointmentsRemoved} appts add/update/remove, ` +
          `${stats.conflictsResolved}/${stats.conflictsDetected} conflicts resolved`,
      );

      return {
        success: errors.length === 0,
        syncId,
        stats,
        durationMs,
        errors,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Sync failed: ${msg}`);
      logger.error(`Schedule sync failed: ${msg}`);

      if (syncId) {
        await this.failSyncSession(syncId, msg);
      }

      return {
        success: false,
        syncId,
        stats,
        durationMs: Date.now() - startTime,
        errors,
      };
    }
  }

  /**
   * Get or create clinic schedule config
   */
  private async getOrCreateClinicConfig(
    clinicId: string,
    idexxConfig: IdexxScheduleConfig | null,
  ): Promise<ClinicScheduleConfig | null> {
    const supabase = await this.getClient();

    // Try to get existing config
    const { data: existing } = await supabase
      .from("clinic_schedule_config")
      .select("*")
      .eq("clinic_id", clinicId)
      .single();

    if (existing) {
      // Update with IDEXX config if available
      if (idexxConfig) {
        const capacity = this.slotGenerator.calculateCapacityFromRooms(
          idexxConfig.rooms?.length ?? 2,
        );

        await supabase
          .from("clinic_schedule_config")
          .update({
            default_capacity: capacity,
            idexx_config_snapshot: idexxConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        return {
          ...existing,
          default_capacity: capacity,
        } as ClinicScheduleConfig;
      }
      return existing as unknown as ClinicScheduleConfig;
    }

    // Create default config
    const capacity = idexxConfig?.rooms?.length ?? 2;

    const { data: newConfig, error } = await supabase
      .from("clinic_schedule_config")
      .insert({
        clinic_id: clinicId,
        open_time: idexxConfig?.businessHours?.start ?? "08:00",
        close_time: idexxConfig?.businessHours?.end ?? "18:00",
        days_of_week: idexxConfig?.businessHours?.daysOfWeek ?? [
          1, 2, 3, 4, 5, 6,
        ],
        slot_duration_minutes: idexxConfig?.slotDuration ?? 15,
        default_capacity: capacity,
        idexx_config_snapshot: idexxConfig,
      })
      .select()
      .single();

    if (error) {
      logger.error(`Failed to create clinic config: ${error.message}`);
      return null;
    }

    return newConfig as unknown as ClinicScheduleConfig;
  }

  /**
   * Get active blocked periods for a clinic
   */
  private async getBlockedPeriods(clinicId: string): Promise<BlockedPeriod[]> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("clinic_blocked_periods")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("is_active", true);

    if (error) {
      logger.error(`Failed to get blocked periods: ${error.message}`);
      return [];
    }

    return (data ?? []) as unknown as BlockedPeriod[];
  }

  /**
   * Create a new sync session
   */
  private async createSyncSession(
    clinicId: string,
    dateRange: { start: Date; end: Date },
    idexxConfig: IdexxScheduleConfig | null,
  ): Promise<string> {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("schedule_syncs")
      .insert({
        clinic_id: clinicId,
        sync_start_date: dateRange.start.toISOString().split("T")[0],
        sync_end_date: dateRange.end.toISOString().split("T")[0],
        status: "in_progress",
        idexx_config: idexxConfig,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create sync session: ${error?.message}`);
    }

    logger.debug(`Created sync session: ${data.id}`);
    return data.id;
  }

  /**
   * Upsert generated slots to database
   */
  private async upsertSlots(
    clinicId: string,
    slots: GeneratedSlot[],
    syncId: string,
  ): Promise<{ created: number; updated: number }> {
    const supabase = await this.getClient();
    let created = 0;
    const updated = 0;

    // Batch upserts for efficiency
    const batchSize = 100;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);

      const slotsToUpsert = batch.map((slot) => ({
        clinic_id: slot.clinic_id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
        last_synced_at: new Date().toISOString(),
        sync_id: syncId,
      }));

      const { error } = await supabase
        .from("schedule_slots")
        .upsert(slotsToUpsert, {
          onConflict: "clinic_id,date,start_time",
        });

      if (error) {
        logger.error(`Failed to upsert slots batch: ${error.message}`);
      } else {
        // Estimate created vs updated (approximation)
        created += batch.length;
      }
    }

    return { created, updated };
  }

  /**
   * Build a map of date+time -> slot_id for appointment linking
   */
  private async buildSlotMap(
    clinicId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<Map<string, string>> {
    const supabase = await this.getClient();
    const slotMap = new Map<string, string>();

    const { data, error } = await supabase
      .from("schedule_slots")
      .select("id, date, start_time")
      .eq("clinic_id", clinicId)
      .gte("date", dateRange.start.toISOString().split("T")[0])
      .lte("date", dateRange.end.toISOString().split("T")[0]);

    if (error) {
      logger.error(`Failed to build slot map: ${error.message}`);
      return slotMap;
    }

    for (const slot of data ?? []) {
      const key = `${slot.date}|${slot.start_time}`;
      slotMap.set(key, slot.id);
    }

    logger.debug(`Built slot map with ${slotMap.size} entries`);
    return slotMap;
  }

  /**
   * Get existing appointments for a date
   */
  private async getExistingAppointments(
    clinicId: string,
    date: string,
  ): Promise<
    Array<{
      id: string;
      neo_appointment_id: string;
      sync_hash: string | null;
      deleted_at: string | null;
    }>
  > {
    const supabase = await this.getClient();

    const { data, error } = await supabase
      .from("schedule_appointments")
      .select("id, neo_appointment_id, sync_hash, deleted_at")
      .eq("clinic_id", clinicId)
      .eq("date", date);

    if (error) {
      logger.error(`Failed to get existing appointments: ${error.message}`);
      return [];
    }

    return data ?? [];
  }

  /**
   * Execute reconciliation plan
   */
  private async executeReconciliation(
    clinicId: string,
    _date: string,
    plans: ReconciliationPlan[],
    slotMap: Map<string, string>,
    slotDurationMinutes: number,
    _syncId: string,
  ): Promise<{ added: number; updated: number; removed: number }> {
    const supabase = await this.getClient();
    let added = 0;
    let updated = 0;
    let removed = 0;

    for (const plan of plans) {
      try {
        const slotId = this.reconciliation.findMatchingSlot(
          _date,
          plan.appointment.start_time,
          slotDurationMinutes,
          slotMap,
        );

        switch (plan.action) {
          case "add": {
            await supabase.from("schedule_appointments").insert({
              clinic_id: clinicId,
              slot_id: slotId,
              neo_appointment_id: plan.neo_appointment_id,
              date: plan.appointment.date,
              start_time: this.normalizeTime24(plan.appointment.start_time),
              end_time: plan.appointment.end_time
                ? this.normalizeTime24(plan.appointment.end_time)
                : null,
              patient_name: plan.appointment.patient_name,
              client_name: plan.appointment.client_name,
              client_phone: plan.appointment.client_phone,
              provider_name: plan.appointment.provider_name,
              appointment_type: plan.appointment.appointment_type,
              status: plan.appointment.status,
              sync_hash: plan.newHash,
              last_synced_at: new Date().toISOString(),
            });
            added++;
            break;
          }
          case "update": {
            await supabase
              .from("schedule_appointments")
              .update({
                slot_id: slotId,
                date: plan.appointment.date,
                start_time: this.normalizeTime24(plan.appointment.start_time),
                end_time: plan.appointment.end_time
                  ? this.normalizeTime24(plan.appointment.end_time)
                  : null,
                patient_name: plan.appointment.patient_name,
                client_name: plan.appointment.client_name,
                client_phone: plan.appointment.client_phone,
                provider_name: plan.appointment.provider_name,
                appointment_type: plan.appointment.appointment_type,
                status: plan.appointment.status,
                sync_hash: plan.newHash,
                last_synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("clinic_id", clinicId)
              .eq("neo_appointment_id", plan.neo_appointment_id);
            updated++;
            break;
          }
          case "remove": {
            // Soft delete
            await supabase
              .from("schedule_appointments")
              .update({
                deleted_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("clinic_id", clinicId)
              .eq("neo_appointment_id", plan.neo_appointment_id);
            removed++;
            break;
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        logger.error(
          `Failed to execute reconciliation for ${plan.neo_appointment_id}: ${msg}`,
        );
      }
    }

    return { added, updated, removed };
  }

  /**
   * Update booked counts for all slots on a date
   */
  private async updateSlotBookedCounts(
    clinicId: string,
    date: string,
  ): Promise<void> {
    const supabase = await this.getClient();

    // Get all slots for this date
    const { data: slots } = await supabase
      .from("schedule_slots")
      .select("id, start_time, end_time")
      .eq("clinic_id", clinicId)
      .eq("date", date);

    if (!slots || slots.length === 0) return;

    // For each slot, count overlapping non-cancelled appointments
    for (const slot of slots) {
      const { count, error } = await supabase
        .from("schedule_appointments")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("date", date)
        .is("deleted_at", null)
        .not("status", "in", '("cancelled","no_show")')
        .lt("start_time", slot.end_time)
        .gt("end_time", slot.start_time);

      if (!error) {
        await supabase
          .from("schedule_slots")
          .update({
            booked_count: count ?? 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", slot.id);
      }
    }
  }

  /**
   * Detect and resolve conflicts with VAPI bookings
   */
  private async resolveConflicts(
    clinicId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{ detected: number; resolved: number }> {
    const supabase = await this.getClient();
    let detected = 0;
    let resolved = 0;

    // Call the auto_reschedule_conflicts function for each date
    const currentDate = new Date(dateRange.start);
    while (currentDate <= dateRange.end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const { data, error } = await supabase.rpc("auto_reschedule_conflicts", {
        p_clinic_id: clinicId,
        p_date: dateStr,
      });

      if (!error && data) {
        const results = data as Array<{
          booking_id: string;
          old_time: string;
          new_time: string;
        }>;
        detected += results.length;
        resolved += results.filter((r) => r.new_time !== null).length;

        for (const result of results) {
          logger.info(
            `Auto-rescheduled booking ${result.booking_id}: ${result.old_time} -> ${result.new_time}`,
          );
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { detected, resolved };
  }

  /**
   * Complete sync session with success status
   */
  private async completeSyncSession(
    syncId: string,
    stats: ScheduleSyncResult["stats"],
    durationMs: number,
  ): Promise<void> {
    const supabase = await this.getClient();

    await supabase
      .from("schedule_syncs")
      .update({
        status: "completed",
        slots_created: stats.slotsCreated,
        slots_updated: stats.slotsUpdated,
        appointments_added: stats.appointmentsAdded,
        appointments_updated: stats.appointmentsUpdated,
        appointments_removed: stats.appointmentsRemoved,
        conflicts_detected: stats.conflictsDetected,
        conflicts_resolved: stats.conflictsResolved,
        completed_at: new Date().toISOString(),
        duration_ms: durationMs,
      })
      .eq("id", syncId);
  }

  /**
   * Mark sync session as failed
   */
  private async failSyncSession(
    syncId: string,
    errorMessage: string,
  ): Promise<void> {
    const supabase = await this.getClient();

    await supabase
      .from("schedule_syncs")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", syncId);
  }

  /**
   * Normalize time to HH:MM:SS format
   */
  private normalizeTime24(timeStr: string): string {
    const match = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(timeStr);

    if (!match) {
      const parts = timeStr.split(":");
      if (parts.length === 2) {
        return `${timeStr}:00`;
      }
      return timeStr;
    }

    let hours = parseInt(match[1] ?? "0", 10);
    const minutes = match[2] ?? "00";
    const meridiem = match[3]?.toLowerCase();

    if (meridiem === "pm" && hours !== 12) {
      hours += 12;
    } else if (meridiem === "am" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
  }
}

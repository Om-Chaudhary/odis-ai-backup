/**
 * Reconciliation Service
 *
 * Handles reconciliation of scraped IDEXX appointments with the database.
 * Detects changes, adds new appointments, updates modified ones, and soft-deletes removed ones.
 * Also handles conflict detection with VAPI bookings.
 */

import { scheduleLogger as logger } from "../lib/logger";
import { calculateSyncHash, hasAppointmentChanged } from "../utils/sync-hash";
import type {
  ScrapedAppointment,
  ReconciliationPlan,
  ReconciliationAction,
} from "../types";

/**
 * Existing appointment record from database
 */
interface ExistingAppointment {
  id: string;
  neo_appointment_id: string;
  sync_hash: string | null;
  deleted_at: string | null;
}

/**
 * Reconciliation statistics
 */
export interface ReconciliationStats {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
}

/**
 * Conflict detection result
 */
export interface ConflictResult {
  booking_id: string;
  old_time: string;
  new_time: string | null;
  client_name: string;
  patient_name: string;
  resolved: boolean;
}

/**
 * Reconciliation Service
 *
 * Compares scraped appointments with existing database records to determine
 * what actions need to be taken (add, update, remove, or no change).
 */
export class ReconciliationService {
  /**
   * Build reconciliation plan by comparing scraped appointments with existing records.
   *
   * @param scraped - Appointments scraped from IDEXX
   * @param existing - Existing appointments from database
   * @returns Array of reconciliation plans
   */
  buildReconciliationPlan(
    scraped: ScrapedAppointment[],
    existing: ExistingAppointment[],
  ): ReconciliationPlan[] {
    const plans: ReconciliationPlan[] = [];

    // Build map of existing appointments by neo_appointment_id
    const existingMap = new Map<string, ExistingAppointment>();
    for (const appt of existing) {
      if (appt.neo_appointment_id && !appt.deleted_at) {
        existingMap.set(appt.neo_appointment_id, appt);
      }
    }

    // Process each scraped appointment
    const processedIds = new Set<string>();

    for (const scrapedAppt of scraped) {
      if (!scrapedAppt.neo_appointment_id) {
        logger.debug("Skipping appointment without neo_appointment_id");
        continue;
      }

      const neoId = scrapedAppt.neo_appointment_id;
      processedIds.add(neoId);

      const existingAppt = existingMap.get(neoId);
      const newHash = calculateSyncHash(scrapedAppt);

      if (!existingAppt) {
        // New appointment
        plans.push({
          neo_appointment_id: neoId,
          action: "add",
          appointment: scrapedAppt,
          existingHash: null,
          newHash,
        });
      } else if (hasAppointmentChanged(scrapedAppt, existingAppt.sync_hash)) {
        // Modified appointment
        plans.push({
          neo_appointment_id: neoId,
          action: "update",
          appointment: scrapedAppt,
          existingHash: existingAppt.sync_hash,
          newHash,
        });
      } else {
        // Unchanged appointment
        plans.push({
          neo_appointment_id: neoId,
          action: "unchanged",
          appointment: scrapedAppt,
          existingHash: existingAppt.sync_hash,
          newHash,
        });
      }
    }

    // Find appointments that were in database but not in scraped data (removed from IDEXX)
    for (const [neoId, existingAppt] of existingMap) {
      if (!processedIds.has(neoId)) {
        // This appointment was removed from IDEXX
        plans.push({
          neo_appointment_id: neoId,
          action: "remove",
          appointment: {
            neo_appointment_id: neoId,
            date: "",
            start_time: "",
            end_time: null,
            patient_name: null,
            client_name: null,
            client_phone: null,
            provider_name: null,
            appointment_type: null,
            status: "cancelled",
          },
          existingHash: existingAppt.sync_hash,
          newHash: "",
        });
      }
    }

    return plans;
  }

  /**
   * Calculate reconciliation statistics from plans
   */
  calculateStats(plans: ReconciliationPlan[]): ReconciliationStats {
    const stats: ReconciliationStats = {
      added: 0,
      updated: 0,
      removed: 0,
      unchanged: 0,
    };

    for (const plan of plans) {
      switch (plan.action) {
        case "add":
          stats.added++;
          break;
        case "update":
          stats.updated++;
          break;
        case "remove":
          stats.removed++;
          break;
        case "unchanged":
          stats.unchanged++;
          break;
      }
    }

    return stats;
  }

  /**
   * Filter plans by action type
   */
  filterByAction(
    plans: ReconciliationPlan[],
    action: ReconciliationAction,
  ): ReconciliationPlan[] {
    return plans.filter((p) => p.action === action);
  }

  /**
   * Get plans that need database writes (add, update, remove)
   */
  getWritablePlans(plans: ReconciliationPlan[]): ReconciliationPlan[] {
    return plans.filter(
      (p) =>
        p.action === "add" || p.action === "update" || p.action === "remove",
    );
  }

  /**
   * Determine slot ID for an appointment based on its time
   *
   * @param date - Appointment date (YYYY-MM-DD)
   * @param startTime - Appointment start time (12-hour or 24-hour format)
   * @param slotDurationMinutes - Duration of each slot in minutes
   * @param slotMap - Map of date+time to slot IDs
   * @returns Slot ID if found
   */
  findMatchingSlot(
    date: string,
    startTime: string,
    slotDurationMinutes: number,
    slotMap: Map<string, string>,
  ): string | null {
    // Normalize time to HH:MM:SS format
    const normalizedTime = this.normalizeTime24(startTime);
    const slotKey = `${date}|${normalizedTime}`;

    // Try exact match first
    if (slotMap.has(slotKey)) {
      return slotMap.get(slotKey) ?? null;
    }

    // Try to find the slot this appointment falls within
    // (appointment might start mid-slot)
    const appointmentMinutes = this.timeToMinutes(normalizedTime);
    const slotStartMinutes =
      Math.floor(appointmentMinutes / slotDurationMinutes) *
      slotDurationMinutes;
    const slotStartTime = this.minutesToTime(slotStartMinutes);
    const roundedSlotKey = `${date}|${slotStartTime}`;

    return slotMap.get(roundedSlotKey) ?? null;
  }

  /**
   * Convert 12-hour time (e.g., "9:30 AM") to 24-hour format (HH:MM:SS)
   */
  private normalizeTime24(timeStr: string): string {
    const match = /(\d{1,2}):(\d{2})\s*(am|pm)?/i.exec(timeStr);

    if (!match) {
      // Already in 24-hour format or invalid - return as-is with seconds
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

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const parts = time.split(":");
    const hours = parseInt(parts[0] ?? "0", 10);
    const minutes = parseInt(parts[1] ?? "0", 10);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string (HH:MM:SS)
   */
  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
  }

  /**
   * Log reconciliation summary
   */
  logSummary(stats: ReconciliationStats): void {
    logger.info(
      `Reconciliation: ${stats.added} added, ${stats.updated} updated, ` +
        `${stats.removed} removed, ${stats.unchanged} unchanged`,
    );
  }
}

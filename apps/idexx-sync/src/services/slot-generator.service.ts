/**
 * Slot Generator Service
 *
 * Generates time slots for a date range based on clinic configuration.
 * Handles business hours, slot duration, and blocked periods (lunch breaks).
 */

import { scheduleLogger as logger } from "../lib/logger";
import type {
  ClinicScheduleConfig,
  BlockedPeriod,
  GeneratedSlot,
} from "../types";

/**
 * Default configuration values
 */
const DEFAULTS = {
  OPEN_TIME: "08:00:00",
  CLOSE_TIME: "18:00:00",
  SLOT_DURATION_MINUTES: 15,
  CAPACITY: 2,
  DAYS_OF_WEEK: [1, 2, 3, 4, 5, 6], // Mon-Sat
};

/**
 * Slot Generator Service
 *
 * Generates time slots based on:
 * - Clinic business hours (from config or IDEXX)
 * - Slot duration (15 minutes default)
 * - Capacity per slot (room-based from IDEXX)
 * - Blocked periods (lunch breaks, meetings)
 */
export class SlotGeneratorService {
  /**
   * Generate slots for a date range
   *
   * @param clinicId - Clinic UUID
   * @param config - Clinic schedule configuration
   * @param blockedPeriods - Active blocked periods (lunch breaks, etc.)
   * @param dateRange - Start and end dates for generation
   * @returns Array of generated slots
   */
  generateSlots(
    clinicId: string,
    config: ClinicScheduleConfig | null,
    blockedPeriods: BlockedPeriod[],
    dateRange: { start: Date; end: Date },
  ): GeneratedSlot[] {
    const slots: GeneratedSlot[] = [];

    // Use config values or defaults
    const openTime = config?.open_time ?? DEFAULTS.OPEN_TIME;
    const closeTime = config?.close_time ?? DEFAULTS.CLOSE_TIME;
    const slotDuration =
      config?.slot_duration_minutes ?? DEFAULTS.SLOT_DURATION_MINUTES;
    const capacity = config?.default_capacity ?? DEFAULTS.CAPACITY;
    const daysOfWeek = config?.days_of_week ?? DEFAULTS.DAYS_OF_WEEK;

    logger.debug(
      `Generating slots: ${openTime}-${closeTime}, ${slotDuration}min duration, capacity=${capacity}`,
    );

    // Iterate through each day in the range
    const currentDate = new Date(dateRange.start);
    currentDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59, 999);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip days not in business days
      if (!daysOfWeek.includes(dayOfWeek)) {
        logger.debug(
          `Skipping ${this.formatDate(currentDate)} - not a business day`,
        );
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Get blocked periods for this day
      const dayBlockedPeriods = blockedPeriods.filter(
        (bp) => bp.is_active && bp.days_of_week.includes(dayOfWeek),
      );

      // Generate slots for this day
      const daySlots = this.generateDaySlots(
        clinicId,
        this.formatDate(currentDate),
        openTime,
        closeTime,
        slotDuration,
        capacity,
        dayBlockedPeriods,
      );

      slots.push(...daySlots);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.info(
      `Generated ${slots.length} slots for ${this.daysBetween(dateRange.start, dateRange.end)} days`,
    );

    return slots;
  }

  /**
   * Generate slots for a single day
   */
  private generateDaySlots(
    clinicId: string,
    date: string,
    openTime: string,
    closeTime: string,
    slotDurationMinutes: number,
    capacity: number,
    blockedPeriods: BlockedPeriod[],
  ): GeneratedSlot[] {
    const slots: GeneratedSlot[] = [];

    // Parse times to minutes since midnight
    const openMinutes = this.timeToMinutes(openTime);
    const closeMinutes = this.timeToMinutes(closeTime);

    let currentMinutes = openMinutes;

    while (currentMinutes + slotDurationMinutes <= closeMinutes) {
      const slotStartTime = this.minutesToTime(currentMinutes);
      const slotEndTime = this.minutesToTime(
        currentMinutes + slotDurationMinutes,
      );

      // Check if this slot overlaps with any blocked period
      const isBlocked = this.isTimeBlocked(
        slotStartTime,
        slotEndTime,
        blockedPeriods,
      );

      if (!isBlocked) {
        slots.push({
          clinic_id: clinicId,
          date,
          start_time: slotStartTime,
          end_time: slotEndTime,
          capacity,
        });
      }

      currentMinutes += slotDurationMinutes;
    }

    return slots;
  }

  /**
   * Check if a time slot overlaps with any blocked period
   */
  private isTimeBlocked(
    slotStart: string,
    slotEnd: string,
    blockedPeriods: BlockedPeriod[],
  ): boolean {
    const slotStartMins = this.timeToMinutes(slotStart);
    const slotEndMins = this.timeToMinutes(slotEnd);

    for (const block of blockedPeriods) {
      const blockStartMins = this.timeToMinutes(block.start_time);
      const blockEndMins = this.timeToMinutes(block.end_time);

      // Check for overlap: slot starts before block ends AND slot ends after block starts
      if (slotStartMins < blockEndMins && slotEndMins > blockStartMins) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert time string (HH:MM:SS or HH:MM) to minutes since midnight
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
   * Format date as YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0] ?? "";
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(start: Date, end: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay)) + 1;
  }

  /**
   * Calculate date range for sync based on config
   */
  getDateRange(config: ClinicScheduleConfig | null): {
    start: Date;
    end: Date;
  } {
    const horizonDays = config?.sync_horizon_days ?? 14;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() + horizonDays);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Update capacity from IDEXX rooms count
   *
   * @param idexxRoomsCount - Number of rooms from IDEXX config
   * @returns Updated capacity (minimum 1)
   */
  calculateCapacityFromRooms(idexxRoomsCount: number): number {
    return Math.max(1, idexxRoomsCount);
  }
}

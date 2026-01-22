/**
 * Clinic Schedule Procedures
 *
 * Fetches clinic operating hours and blocked periods (lunch breaks, etc.)
 * for determining if calls occurred during active vs after hours.
 *
 * NOTE: This uses the same filtering as settings.schedule.getBlockedPeriods
 * to ensure consistency. Only active periods are returned for dividers.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const clinicScheduleRouter = createTRPCRouter({
  /**
   * Get clinic schedule config and blocked periods by clinic ID
   * Used to determine if calls occurred during active hours or after hours
   *
   * IMPORTANT: Only returns ACTIVE blocked periods (is_active = true)
   * This ensures dividers only show for currently enabled time segments
   */
  getClinicSchedule: protectedProcedure
    .input(
      z.object({
        clinicId: z.string().uuid(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      // Fetch schedule config
      const { data: scheduleConfig, error: scheduleError } = await supabase
        .from("clinic_schedule_config")
        .select("daily_hours, timezone")
        .eq("clinic_id", input.clinicId)
        .single();

      if (scheduleError && scheduleError.code !== "PGRST116") {
        console.error("Error fetching clinic schedule config:", scheduleError);
      }

      // Fetch ONLY ACTIVE blocked periods (lunch breaks, etc.)
      // This matches the settings UI - only active periods create dividers
      const { data: blockedPeriods, error: blockedError } = await supabase
        .from("clinic_blocked_periods")
        .select("name, start_time, end_time, days_of_week, is_active")
        .eq("clinic_id", input.clinicId)
        .eq("is_active", true)
        .order("start_time");

      if (blockedError) {
        console.error("Error fetching clinic blocked periods:", blockedError);
      }

      return {
        scheduleConfig: scheduleConfig ?? {
          daily_hours: {
            "0": { enabled: false },
            "1": { enabled: true, open: "08:00", close: "18:00" },
            "2": { enabled: true, open: "08:00", close: "18:00" },
            "3": { enabled: true, open: "08:00", close: "18:00" },
            "4": { enabled: true, open: "08:00", close: "18:00" },
            "5": { enabled: true, open: "08:00", close: "18:00" },
            "6": { enabled: true, open: "08:00", close: "18:00" },
          },
          timezone: "America/Los_Angeles",
        },
        blockedPeriods: blockedPeriods ?? [],
      };
    }),
});

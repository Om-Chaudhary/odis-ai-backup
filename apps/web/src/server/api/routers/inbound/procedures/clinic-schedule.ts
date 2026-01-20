/**
 * Clinic Schedule Procedures
 *
 * Fetches clinic operating hours and blocked periods (lunch breaks, etc.)
 * for determining if calls occurred during active vs after hours.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const clinicScheduleRouter = createTRPCRouter({
  /**
   * Get clinic schedule config and blocked periods by clinic ID
   * Used to determine if calls occurred during active hours or after hours
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
        .select("open_time, close_time, days_of_week, timezone")
        .eq("clinic_id", input.clinicId)
        .single();

      if (scheduleError && scheduleError.code !== "PGRST116") {
        console.error("Error fetching clinic schedule config:", scheduleError);
      }

      // Fetch blocked periods (lunch breaks, etc.)
      const { data: blockedPeriods, error: blockedError } = await supabase
        .from("clinic_blocked_periods")
        .select("name, start_time, end_time, days_of_week")
        .eq("clinic_id", input.clinicId)
        .eq("is_active", true);

      if (blockedError) {
        console.error("Error fetching clinic blocked periods:", blockedError);
      }

      return {
        scheduleConfig: scheduleConfig ?? {
          open_time: "08:00:00",
          close_time: "18:00:00",
          days_of_week: [1, 2, 3, 4, 5, 6], // Mon-Sat default
          timezone: "America/Los_Angeles",
        },
        blockedPeriods: blockedPeriods ?? [],
      };
    }),
});

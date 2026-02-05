import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createServerClient } from "@odis-ai/data-access/db/server";
import { getClinicByUserId, getClinicBySlug } from "@odis-ai/domain/clinics";
import { DailyHoursSchema } from "@odis-ai/shared/validators";
import type { DailyHours } from "@odis-ai/shared/types";

/** Typed response for schedule config mutations */
interface ScheduleConfigResponse {
  id: string;
  clinic_id: string;
  daily_hours: DailyHours;
  timezone: string;
  created_at: string;
  updated_at: string;
}

/**
 * Schedule Settings Router
 *
 * Manages business hours and blocked periods (lunch breaks, staff meetings, etc.)
 */
export const scheduleRouter = createTRPCRouter({
  /**
   * Get clinic schedule configuration (business hours)
   */
  getScheduleConfig: protectedProcedure
    .input(
      z
        .object({
          clinicSlug: z.string().optional(),
          clinicId: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic (prioritize clinicId, then slug, then user's clinic)
      let clinic;
      if (input?.clinicId) {
        // Direct clinic ID lookup (used by inbound table)
        const { data } = await ctx.supabase
          .from("clinics")
          .select("id, name, slug")
          .eq("id", input.clinicId)
          .single();
        clinic = data;
      } else if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      if (!clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      const supabase = await createServerClient();

      const { data, error } = await supabase
        .from("clinic_schedule_config")
        .select("*")
        .eq("clinic_id", clinic.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found (acceptable)
        throw new Error(`Failed to fetch schedule config: ${error.message}`);
      }

      return data;
    }),

  /**
   * Update clinic schedule configuration
   */
  updateScheduleConfig: protectedProcedure
    .input(
      z.object({
        clinicSlug: z.string().optional(),
        clinicId: z.string().uuid().optional(),
        daily_hours: DailyHoursSchema,
        timezone: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic (prioritize clinicId, then slug, then user's clinic)
      let clinic;
      if (input.clinicId) {
        // Direct clinic ID lookup
        const { data } = await ctx.supabase
          .from("clinics")
          .select("id, name, slug")
          .eq("id", input.clinicId)
          .single();
        clinic = data;
      } else if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      if (!clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      // Use RLS-enabled client for consistency with query
      const supabase = ctx.supabase;

      // Check if config exists
      const { data: existing } = await supabase
        .from("clinic_schedule_config")
        .select("id")
        .eq("clinic_id", clinic.id)
        .single();

      if (existing) {
        // Update existing config
        const { data, error } = await supabase
          .from("clinic_schedule_config")
          .update({
            daily_hours: input.daily_hours,
            timezone: input.timezone,
            updated_at: new Date().toISOString(),
          })
          .eq("clinic_id", clinic.id)
          .select(
            "id, clinic_id, daily_hours, timezone, created_at, updated_at",
          )
          .single();

        if (error) {
          throw new Error(`Failed to update schedule config: ${error.message}`);
        }

        return {
          id: data.id,
          clinic_id: data.clinic_id,
          daily_hours: data.daily_hours as unknown as DailyHours,
          timezone: data.timezone,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } satisfies ScheduleConfigResponse;
      } else {
        // Create new config
        const { data, error } = await supabase
          .from("clinic_schedule_config")
          .insert({
            clinic_id: clinic.id,
            daily_hours: input.daily_hours,
            timezone: input.timezone,
          })
          .select(
            "id, clinic_id, daily_hours, timezone, created_at, updated_at",
          )
          .single();

        if (error) {
          throw new Error(`Failed to create schedule config: ${error.message}`);
        }

        return {
          id: data.id,
          clinic_id: data.clinic_id,
          daily_hours: data.daily_hours as unknown as DailyHours,
          timezone: data.timezone,
          created_at: data.created_at,
          updated_at: data.updated_at,
        } satisfies ScheduleConfigResponse;
      }
    }),

  /**
   * Get all blocked periods (lunch breaks, staff meetings, etc.)
   *
   * NOTE: This is the source of truth for blocked periods.
   * Both settings UI and inbound table should use this endpoint.
   */
  getBlockedPeriods: protectedProcedure
    .input(
      z
        .object({
          clinicSlug: z.string().optional(),
          clinicId: z.string().uuid().optional(),
          activeOnly: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic (prioritize clinicId, then slug, then user's clinic)
      let clinic;
      if (input?.clinicId) {
        // Direct clinic ID lookup (used by inbound table)
        const { data } = await ctx.supabase
          .from("clinics")
          .select("id, name, slug")
          .eq("id", input.clinicId)
          .single();
        clinic = data;
      } else if (input?.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      if (!clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      const supabase = await createServerClient();

      // Build query
      let query = supabase
        .from("clinic_blocked_periods")
        .select("*")
        .eq("clinic_id", clinic.id);

      // Filter by active status if requested
      if (input?.activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query.order("start_time");

      if (error) {
        throw new Error(`Failed to fetch blocked periods: ${error.message}`);
      }

      return data ?? [];
    }),

  /**
   * Create a new blocked period
   */
  createBlockedPeriod: protectedProcedure
    .input(
      z.object({
        clinicSlug: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        start_time: z.string(),
        end_time: z.string(),
        days_of_week: z.array(z.number().min(0).max(6)),
        is_active: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic (use slug if provided, otherwise get user's clinic)
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      if (!clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      // Use RLS-enabled client for consistency
      const { data, error } = await ctx.supabase
        .from("clinic_blocked_periods")
        .insert({
          clinic_id: clinic.id,
          name: input.name,
          start_time: input.start_time,
          end_time: input.end_time,
          days_of_week: input.days_of_week,
          is_active: input.is_active,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create blocked period: ${error.message}`);
      }

      return data;
    }),

  /**
   * Update an existing blocked period
   */
  updateBlockedPeriod: protectedProcedure
    .input(
      z.object({
        clinicSlug: z.string().optional(),
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        start_time: z.string().optional(),
        end_time: z.string().optional(),
        days_of_week: z.array(z.number().min(0).max(6)).optional(),
        is_active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic (use slug if provided, otherwise get user's clinic)
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      if (!clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      // Use RLS-enabled client for consistency
      const { id, ...updates } = input;

      const { data, error } = await ctx.supabase
        .from("clinic_blocked_periods")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("clinic_id", clinic.id) // Ensure user owns this period
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update blocked period: ${error.message}`);
      }

      return data;
    }),

  /**
   * Delete a blocked period
   */
  deleteBlockedPeriod: protectedProcedure
    .input(
      z.object({
        clinicSlug: z.string().optional(),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic (use slug if provided, otherwise get user's clinic)
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      if (!clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      // Use RLS-enabled client for consistency
      const { error } = await ctx.supabase
        .from("clinic_blocked_periods")
        .delete()
        .eq("id", input.id)
        .eq("clinic_id", clinic.id); // Ensure user owns this period

      if (error) {
        throw new Error(`Failed to delete blocked period: ${error.message}`);
      }

      return { success: true };
    }),
});

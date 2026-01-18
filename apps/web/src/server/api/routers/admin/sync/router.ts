import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { createClient } from "@odis-ai/data-access/db/server";
import {
  getActiveSyncsSchema,
  getSyncHistorySchema,
  triggerSyncSchema,
  getSyncSchedulesSchema,
  updateSyncScheduleSchema,
} from "./schemas";
import { TRPCError } from "@trpc/server";

const PIMS_SYNC_URL =
  process.env.PIMS_SYNC_URL ?? "https://pims-sync-production.up.railway.app";

export const adminSyncRouter = createTRPCRouter({
  /**
   * Get PIMS sync service health status
   */
  getServiceHealth: adminProcedure.query(async () => {
    try {
      const response = await fetch(`${PIMS_SYNC_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: "healthy" as const,
        uptime: data.uptime ?? "Unknown",
        service: "PIMS Sync Service",
      };
    } catch (error) {
      return {
        status: "unhealthy" as const,
        uptime: "N/A",
        service: "PIMS Sync Service",
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }),

  /**
   * Get currently running sync operations
   */
  getActiveSyncs: adminProcedure
    .input(getActiveSyncsSchema)
    .query(async ({ input }) => {
      const supabase = await createClient();

      let query = supabase
        .from("case_sync_audits")
        .select(
          `
          id,
          clinic_id,
          started_at,
          status,
          clinics (
            id,
            name,
            slug
          )
        `,
        )
        .eq("status", "running")
        .order("started_at", { ascending: false });

      if (input.clinicId) {
        query = query.eq("clinic_id", input.clinicId);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch active syncs",
          cause: error,
        });
      }

      return data ?? [];
    }),

  /**
   * Get sync history with pagination
   */
  getSyncHistory: adminProcedure
    .input(getSyncHistorySchema)
    .query(async ({ input }) => {
      const supabase = await createClient();

      let query = supabase
        .from("case_sync_audits")
        .select(
          `
          id,
          clinic_id,
          started_at,
          completed_at,
          status,
          inbound_cases_created,
          inbound_cases_updated,
          discharge_cases_updated,
          error_message,
          clinics (
            id,
            name,
            slug
          )
        `,
          { count: "exact" },
        )
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (input.clinicId) {
        query = query.eq("clinic_id", input.clinicId);
      }

      query = query.range(input.offset, input.offset + input.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch sync history",
          cause: error,
        });
      }

      return {
        syncs: data ?? [],
        total: count ?? 0,
      };
    }),

  /**
   * Trigger a sync operation
   */
  triggerSync: adminProcedure
    .input(triggerSyncSchema)
    .mutation(async ({ input }) => {
      try {
        const endpoint =
          input.type === "inbound" ? "/sync/inbound" : "/sync/case";

        const response = await fetch(`${PIMS_SYNC_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId: input.clinicId }),
        });

        if (!response.ok) {
          throw new Error(`Sync trigger failed: ${response.status}`);
        }

        const data = await response.json();

        return {
          success: true,
          message: `${input.type} sync triggered successfully`,
          data,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to trigger ${input.type} sync`,
          cause: error,
        });
      }
    }),

  /**
   * Get sync schedules for a clinic
   */
  getSyncSchedules: adminProcedure
    .input(getSyncSchedulesSchema)
    .query(async ({ input }) => {
      const supabase = await createClient();

      let query = supabase.from("clinic_schedule_config").select("*");

      if (input.clinicId) {
        query = query.eq("clinic_id", input.clinicId);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch sync schedules",
          cause: error,
        });
      }

      return data ?? [];
    }),

  /**
   * Update sync schedule configuration
   */
  updateSyncSchedule: adminProcedure
    .input(updateSyncScheduleSchema)
    .mutation(async ({ input }) => {
      const supabase = await createClient();

      // Check if schedule exists
      const { data: existing } = await supabase
        .from("clinic_schedule_config")
        .select("id")
        .eq("clinic_id", input.clinicId)
        .single();

      if (existing) {
        // Update existing schedule
        const { data, error } = await supabase
          .from("clinic_schedule_config")
          .update({
            // Note: This would need actual column names from your schema
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update sync schedule",
            cause: error,
          });
        }

        return data;
      } else {
        // Create new schedule
        const { data, error } = await supabase
          .from("clinic_schedule_config")
          .insert({
            clinic_id: input.clinicId,
            // Note: This would need actual column names from your schema
          })
          .select()
          .single();

        if (error || !data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create sync schedule",
            cause: error,
          });
        }

        return data;
      }
    }),
});

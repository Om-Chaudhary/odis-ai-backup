import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import {
  getActiveSyncsSchema,
  getSyncHistorySchema,
  triggerSyncSchema,
  triggerFullSyncSchema,
  getSyncSchedulesSchema,
  getClinicSyncConfigSchema,
  getIdexxCredentialStatusSchema,
  updateSyncScheduleSchema,
  type SyncScheduleItem,
} from "./schemas";
import { TRPCError } from "@trpc/server";

const PIMS_SYNC_URL =
  process.env.PIMS_SYNC_URL ?? "https://pims-sync-production.up.railway.app";
const PIMS_SYNC_API_KEY = process.env.PIMS_SYNC_API_KEY ?? "";

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
        version: data.version ?? "Unknown",
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
   * Get scheduler status with running jobs
   */
  getSchedulerStatus: adminProcedure.query(async () => {
    try {
      const response = await fetch(`${PIMS_SYNC_URL}/api/scheduler/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": PIMS_SYNC_API_KEY,
        },
      });

      if (!response.ok) {
        return {
          running: false,
          totalJobs: 0,
          jobsByType: {},
          jobs: [],
        };
      }

      return await response.json();
    } catch {
      return {
        running: false,
        totalJobs: 0,
        jobsByType: {},
        jobs: [],
      };
    }
  }),

  /**
   * Get currently running sync operations
   */
  getActiveSyncs: adminProcedure
    .input(getActiveSyncsSchema)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      let query = supabase
        .from("case_sync_audits")
        .select(
          `
          id,
          clinic_id,
          sync_type,
          created_at,
          status,
          total_items,
          processed_items,
          progress_percentage,
          last_progress_update,
          clinics (
            id,
            name,
            slug
          )
        `,
        )
        .in("status", ["running", "in_progress"])
        .order("created_at", { ascending: false });

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
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      let query = supabase
        .from("case_sync_audits")
        .select(
          `
          id,
          clinic_id,
          sync_type,
          created_at,
          updated_at,
          status,
          appointments_found,
          cases_created,
          cases_updated,
          cases_skipped,
          cases_deleted,
          error_message,
          clinics (
            id,
            name,
            slug
          )
        `,
          { count: "exact" },
        )
        .not("status", "in", "(running,in_progress)")
        .order("created_at", { ascending: false });

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
        // Map to API endpoint path
        const endpointMap = {
          inbound: "/api/sync/inbound",
          cases: "/api/sync/cases",
          reconciliation: "/api/sync/reconcile",
        };

        const endpoint = endpointMap[input.type];

        const response = await fetch(`${PIMS_SYNC_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": PIMS_SYNC_API_KEY,
          },
          body: JSON.stringify({ clinicId: input.clinicId }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Sync trigger failed: ${response.status} - ${errorText}`,
          );
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
          message: `Failed to trigger ${input.type} sync: ${error instanceof Error ? error.message : "Unknown error"}`,
          cause: error,
        });
      }
    }),

  /**
   * Trigger a full bidirectional sync operation
   * Syncs both backward (past cases) and forward (future appointments)
   */
  triggerFullSync: adminProcedure
    .input(triggerFullSyncSchema)
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${PIMS_SYNC_URL}/api/sync/full`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": PIMS_SYNC_API_KEY,
          },
          body: JSON.stringify({
            clinicId: input.clinicId,
            bidirectional: true,
            backwardDays: input.lookbackDays,
            forwardDays: input.forwardDays,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Full sync trigger failed: ${response.status} - ${errorText}`,
          );
        }

        const data = await response.json();

        return {
          success: true,
          message: `Full sync triggered successfully (${input.lookbackDays}d backward + ${input.forwardDays}d forward)`,
          data,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to trigger full sync: ${error instanceof Error ? error.message : "Unknown error"}`,
          cause: error,
        });
      }
    }),

  /**
   * Get all sync schedules (for admin overview)
   */
  getSyncSchedules: adminProcedure
    .input(getSyncSchedulesSchema)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      let query = supabase.from("clinic_schedule_config").select(
        `
          id,
          clinic_id,
          sync_schedules,
          timezone,
          updated_at,
          clinics (
            id,
            name,
            slug
          )
        `,
      );

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
   * Get sync configuration for a specific clinic
   */
  getClinicSyncConfig: adminProcedure
    .input(getClinicSyncConfigSchema)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from("clinic_schedule_config")
        .select(
          `
          id,
          clinic_id,
          sync_schedules,
          timezone,
          open_time,
          close_time,
          days_of_week,
          updated_at
        `,
        )
        .eq("clinic_id", input.clinicId)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch clinic sync config",
          cause: error,
        });
      }

      // Parse sync_schedules from JSONB
      const schedules: SyncScheduleItem[] = [];
      if (data?.sync_schedules && Array.isArray(data.sync_schedules)) {
        for (const s of data.sync_schedules) {
          if (s && typeof s === "object" && "type" in s && "cron" in s) {
            schedules.push({
              type: s.type as "inbound" | "cases" | "reconciliation",
              cron: s.cron as string,
              enabled: (s.enabled as boolean) ?? true,
            });
          }
        }
      }

      return {
        exists: !!data,
        config: data
          ? {
              id: data.id,
              clinicId: data.clinic_id,
              schedules,
              timezone: data.timezone,
              openTime: data.open_time,
              closeTime: data.close_time,
              daysOfWeek: data.days_of_week,
              updatedAt: data.updated_at,
            }
          : null,
      };
    }),

  /**
   * Get IDEXX credential status for a clinic
   */
  getIdexxCredentialStatus: adminProcedure
    .input(getIdexxCredentialStatusSchema)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data, error } = await supabase
        .from("idexx_credentials")
        .select(
          `
          id,
          is_active,
          sync_enabled,
          validation_status,
          last_validated_at,
          last_used_at,
          created_at,
          updated_at
        `,
        )
        .eq("clinic_id", input.clinicId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch IDEXX credential status",
          cause: error,
        });
      }

      return {
        hasCredentials: !!data,
        credential: data
          ? {
              id: data.id,
              isActive: data.is_active,
              syncEnabled: data.sync_enabled,
              validationStatus: data.validation_status,
              lastValidatedAt: data.last_validated_at,
              lastUsedAt: data.last_used_at,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : null,
      };
    }),

  /**
   * Update sync schedule configuration for a clinic
   */
  updateSyncSchedule: adminProcedure
    .input(updateSyncScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("timezone")
        .eq("id", input.clinicId)
        .maybeSingle();

      if (clinicError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch clinic timezone",
          cause: clinicError,
        });
      }

      const clinicTimezone = clinic?.timezone ?? "America/Los_Angeles";

      // Check if schedule config exists
      const { data: existing } = await supabase
        .from("clinic_schedule_config")
        .select("id")
        .eq("clinic_id", input.clinicId)
        .maybeSingle();

      // Format schedules for JSONB storage
      const syncSchedulesJson = input.schedules.map((s) => ({
        type: s.type,
        cron: s.cron,
        enabled: s.enabled,
      }));

      if (existing) {
        // Update existing schedule
        const { data, error } = await supabase
          .from("clinic_schedule_config")
          .update({
            sync_schedules: syncSchedulesJson,
            timezone: clinicTimezone,
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

        return { success: true, action: "updated", configId: data.id };
      } else {
        // Create new schedule config with defaults
        const { data, error } = await supabase
          .from("clinic_schedule_config")
          .insert({
            clinic_id: input.clinicId,
            sync_schedules: syncSchedulesJson,
            timezone: clinicTimezone,
            open_time: "08:00",
            close_time: "18:00",
            days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
            slot_duration_minutes: 15,
            default_capacity: 1,
            sync_horizon_days: 14,
            stale_threshold_minutes: 60,
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

        return { success: true, action: "created", configId: data.id };
      }
    }),
});

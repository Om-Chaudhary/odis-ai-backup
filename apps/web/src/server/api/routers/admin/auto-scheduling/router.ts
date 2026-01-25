/**
 * Auto-Scheduling Admin Router
 *
 * Provides admin procedures for managing automated discharge scheduling.
 */

import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { TRPCError } from "@trpc/server";
import {
  getConfigSchema,
  updateConfigSchema,
  toggleEnabledSchema,
  getRecentRunsSchema,
  getRunDetailsSchema,
  getScheduledItemsSchema,
  cancelItemSchema,
  triggerForClinicSchema,
  getEligibleCasesPreviewSchema,
} from "./schemas";
// eslint-disable-next-line @nx/enforce-module-boundaries -- Router is leaf dependency, no circular import risk
import {
  getOrCreateConfig,
  updateConfig,
  toggleEnabled,
  getAllConfigs,
  runForClinic,
  cancelAutoScheduledItem,
  getRecentRuns,
  getScheduledItems,
  getEligibleCases,
  checkCaseEligibility,
} from "@odis-ai/domain/auto-scheduling";

export const adminAutoSchedulingRouter = createTRPCRouter({
  /**
   * Get config for a specific clinic
   */
  getConfig: adminProcedure.input(getConfigSchema).query(async ({ ctx, input }) => {
    try {
      const config = await getOrCreateConfig(ctx.supabase, input.clinicId);
      return config;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch auto-scheduling config",
        cause: error,
      });
    }
  }),

  /**
   * Get all configs (for admin overview)
   */
  getAllConfigs: adminProcedure.query(async ({ ctx }) => {
    try {
      const configs = await getAllConfigs(ctx.supabase);

      // Get clinic names
      const { data: clinics } = await ctx.supabase
        .from("clinics")
        .select("id, name, slug")
        .in(
          "id",
          configs.map((c) => c.clinicId),
        );

      const clinicMap = new Map(clinics?.map((c) => [c.id, c]) ?? []);

      return configs.map((config) => ({
        ...config,
        clinic: clinicMap.get(config.clinicId) ?? null,
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch all configs",
        cause: error,
      });
    }
  }),

  /**
   * Update config for a clinic
   */
  updateConfig: adminProcedure.input(updateConfigSchema).mutation(async ({ ctx, input }) => {
    const { clinicId, ...updates } = input;

    try {
      const config = await updateConfig(ctx.supabase, clinicId, updates);
      return { success: true, config };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update auto-scheduling config",
        cause: error,
      });
    }
  }),

  /**
   * Toggle enabled status for a clinic
   */
  toggleEnabled: adminProcedure.input(toggleEnabledSchema).mutation(async ({ ctx, input }) => {
    try {
      const config = await toggleEnabled(ctx.supabase, input.clinicId, input.enabled);
      return { success: true, isEnabled: config.isEnabled };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to toggle auto-scheduling",
        cause: error,
      });
    }
  }),

  /**
   * Get recent runs
   */
  getRecentRuns: adminProcedure.input(getRecentRunsSchema).query(async ({ ctx, input }) => {
    try {
      const runs = await getRecentRuns(ctx.supabase, input.limit);
      return runs;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch recent runs",
        cause: error,
      });
    }
  }),

  /**
   * Get run details
   */
  getRunDetails: adminProcedure.input(getRunDetailsSchema).query(async ({ ctx, input }) => {
    try {
      const { data, error } = await ctx.supabase
        .from("auto_scheduling_runs")
        .select("*")
        .eq("id", input.runId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Run not found",
        });
      }

      return {
        id: data.id,
        startedAt: data.started_at,
        completedAt: data.completed_at,
        status: data.status,
        results: data.results ?? [],
        totalCasesProcessed: data.total_cases_processed ?? 0,
        totalEmailsScheduled: data.total_emails_scheduled ?? 0,
        totalCallsScheduled: data.total_calls_scheduled ?? 0,
        totalErrors: data.total_errors ?? 0,
        errorMessage: data.error_message,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch run details",
        cause: error,
      });
    }
  }),

  /**
   * Get scheduled items for a clinic
   */
  getScheduledItems: adminProcedure.input(getScheduledItemsSchema).query(async ({ ctx, input }) => {
    try {
      const items = await getScheduledItems(ctx.supabase, input.clinicId, input.status);

      // Get case details for display
      const caseIds = items.map((i) => i.case_id).filter(Boolean);
      const { data: cases } = await ctx.supabase
        .from("cases")
        .select("id, entity_extraction, created_at")
        .in("id", caseIds);

      const caseMap = new Map(cases?.map((c) => [c.id, c]) ?? []);

      return items.slice(0, input.limit).map((item) => {
        const caseData = caseMap.get(item.case_id);
        const entities = caseData?.entity_extraction as {
          patient?: { name?: string; owner?: { name?: string } };
        } | null;

        return {
          id: item.id,
          caseId: item.case_id,
          clinicId: item.clinic_id,
          status: item.status,
          scheduledEmailId: item.scheduled_email_id,
          scheduledCallId: item.scheduled_call_id,
          scheduledConfig: item.scheduled_config,
          createdAt: item.created_at,
          cancelledAt: item.cancelled_at,
          cancellationReason: item.cancellation_reason,
          patientName: entities?.patient?.name ?? null,
          ownerName: entities?.patient?.owner?.name ?? null,
          caseCreatedAt: caseData?.created_at ?? null,
        };
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch scheduled items",
        cause: error,
      });
    }
  }),

  /**
   * Cancel an auto-scheduled item
   */
  cancelItem: adminProcedure.input(cancelItemSchema).mutation(async ({ ctx, input }) => {
    try {
      await cancelAutoScheduledItem(ctx.supabase, {
        itemId: input.itemId,
        userId: ctx.userId ?? "",
        reason: input.reason,
      });

      return { success: true };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to cancel item",
        cause: error,
      });
    }
  }),

  /**
   * Manually trigger auto-scheduling for a clinic
   */
  triggerForClinic: adminProcedure.input(triggerForClinicSchema).mutation(async ({ ctx, input }) => {
    try {
      // Verify clinic exists
      const { data: clinic, error: clinicError } = await ctx.supabase
        .from("clinics")
        .select("id, name")
        .eq("id", input.clinicId)
        .single();

      if (clinicError || !clinic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Clinic not found",
        });
      }

      // Get or create config for the clinic (ensures config exists before running)
      await getOrCreateConfig(ctx.supabase, input.clinicId);

      // Run the scheduler
      const result = await runForClinic(ctx.supabase, input.clinicId, {
        dryRun: input.dryRun,
      });

      return {
        success: result.status !== "failed",
        runId: result.id,
        dryRun: input.dryRun,
        clinicName: clinic.name,
        casesProcessed: result.totalCasesProcessed,
        emailsScheduled: result.totalEmailsScheduled,
        callsScheduled: result.totalCallsScheduled,
        errors: result.totalErrors,
        errorMessage: result.errorMessage,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to trigger auto-scheduling",
        cause: error,
      });
    }
  }),

  /**
   * Preview eligible cases for a clinic (without scheduling)
   */
  getEligibleCasesPreview: adminProcedure
    .input(getEligibleCasesPreviewSchema)
    .query(async ({ ctx, input }) => {
      try {
        const config = await getOrCreateConfig(ctx.supabase, input.clinicId);
        const cases = await getEligibleCases(ctx.supabase, input.clinicId, config.schedulingCriteria);

        // Check eligibility for each and add details
        const casesWithDetails = cases.slice(0, input.limit).map((caseData) => {
          const eligibility = checkCaseEligibility(caseData, config.schedulingCriteria);
          const entities = caseData.entityExtraction as {
            patient?: { name?: string; owner?: { name?: string; phone?: string; email?: string } };
          } | null;

          return {
            id: caseData.id,
            createdAt: caseData.createdAt,
            status: caseData.status,
            patientName: entities?.patient?.name ?? null,
            ownerName: entities?.patient?.owner?.name ?? null,
            ownerPhone: entities?.patient?.owner?.phone ?? null,
            ownerEmail: entities?.patient?.owner?.email ?? null,
            hasDischargeSummary: caseData.hasDischargeSummary,
            isEligible: eligibility.isEligible,
            ineligibilityReason: eligibility.reason ?? null,
          };
        });

        return {
          total: cases.length,
          eligible: casesWithDetails.filter((c) => c.isEligible).length,
          cases: casesWithDetails,
          config: {
            emailDelayDays: config.emailDelayDays,
            callDelayDays: config.callDelayDays,
            autoEmailEnabled: config.autoEmailEnabled,
            autoCallEnabled: config.autoCallEnabled,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to preview eligible cases",
          cause: error,
        });
      }
    }),

  /**
   * Get stats for dashboard
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    try {
      // Get recent run stats
      const { data: recentRuns } = await ctx.supabase
        .from("auto_scheduling_runs")
        .select("status, total_cases_processed, total_emails_scheduled, total_calls_scheduled")
        .order("started_at", { ascending: false })
        .limit(10);

      // Get enabled clinic count
      const { count: enabledClinics } = await ctx.supabase
        .from("auto_scheduling_config")
        .select("id", { count: "exact", head: true })
        .eq("is_enabled", true);

      // Get scheduled items by status
      const { data: scheduledItems } = await ctx.supabase
        .from("auto_scheduled_items")
        .select("status");

      const statusCounts = {
        scheduled: 0,
        cancelled: 0,
        completed: 0,
        failed: 0,
      };

      scheduledItems?.forEach((item) => {
        if (item.status && item.status in statusCounts) {
          statusCounts[item.status as keyof typeof statusCounts]++;
        }
      });

      // Calculate totals from recent runs
      const totals = (recentRuns ?? []).reduce(
        (acc, run) => ({
          casesProcessed: acc.casesProcessed + (run.total_cases_processed ?? 0),
          emailsScheduled: acc.emailsScheduled + (run.total_emails_scheduled ?? 0),
          callsScheduled: acc.callsScheduled + (run.total_calls_scheduled ?? 0),
        }),
        { casesProcessed: 0, emailsScheduled: 0, callsScheduled: 0 },
      );

      return {
        enabledClinics: enabledClinics ?? 0,
        recentRuns: recentRuns?.length ?? 0,
        totals,
        itemsByStatus: statusCounts,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch stats",
        cause: error,
      });
    }
  }),
});

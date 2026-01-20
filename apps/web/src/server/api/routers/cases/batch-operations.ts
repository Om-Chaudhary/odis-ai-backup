/**
 * Cases Router - Batch Operations Procedures
 *
 * Batch discharge operations.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  getClinicUserIds,
  getClinicByUserId,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";

export const batchOperationsRouter = createTRPCRouter({
  /**
   * Get eligible cases for batch discharge processing
   * Clinic-scoped: shows cases for all users in the same clinic
   * Includes:
   * - Cases with discharge summaries
   * - IDEXX Neo cases with consultation_notes in metadata
   * - Manual cases with transcriptions or SOAP notes
   */
  getEligibleCasesForBatch: protectedProcedure.query(async ({ ctx }) => {
    // Get clinic and user IDs for hybrid scoping
    const clinic = await getClinicByUserId(ctx.user.id, ctx.supabase);
    const clinicUserIds = await getClinicUserIds(ctx.user.id, ctx.supabase);

    // Get user's batch preferences
    const { data: userSettings } = await ctx.supabase
      .from("users")
      .select("batch_include_idexx_notes, batch_include_manual_transcriptions")
      .eq("id", ctx.user.id)
      .single();

    const includeIdexxNotes = userSettings?.batch_include_idexx_notes ?? true;
    const includeManualTranscriptions =
      userSettings?.batch_include_manual_transcriptions ?? true;

    // Query all cases with related data for the clinic (not requiring discharge_summaries)
    const { data: cases, error } = await ctx.supabase
      .from("cases")
      .select(
        `
          id,
          source,
          metadata,
          created_at,
          scheduled_at,
          patients!inner (
            id,
            name,
            owner_name,
            owner_email,
            owner_phone
          ),
          discharge_summaries (
            id
          ),
          transcriptions (
            id,
            transcript
          ),
          soap_notes (
            id,
            subjective,
            objective,
            assessment,
            plan
          ),
          scheduled_discharge_emails (
            id,
            status
          ),
          scheduled_discharge_calls (
            id,
            status
          )
        `,
      )
      .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
      .order("scheduled_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch eligible cases",
        cause: error,
      });
    }

    // Filter for eligible cases
    const eligibleCases = [];

    for (const caseData of cases ?? []) {
      // Extract patient data
      const patient = Array.isArray(caseData.patients)
        ? caseData.patients[0]
        : caseData.patients;

      if (!patient) continue;

      // Check if has valid contact info
      const hasEmail = !!patient.owner_email;
      const hasPhone = !!patient.owner_phone;

      if (!hasEmail && !hasPhone) continue;

      // Check if already scheduled
      const hasScheduledEmail = Array.isArray(
        caseData.scheduled_discharge_emails,
      )
        ? caseData.scheduled_discharge_emails.some(
            (e: { status: string }) =>
              e.status === "queued" || e.status === "sent",
          )
        : false;

      const hasScheduledCall = Array.isArray(caseData.scheduled_discharge_calls)
        ? caseData.scheduled_discharge_calls.some((c: { status: string }) =>
            ["queued", "ringing", "in_progress", "completed"].includes(
              c.status,
            ),
          )
        : false;

      // Don't skip - we want to show all cases and let UI filter by status
      // Old behavior: if (hasScheduledEmail || hasScheduledCall) continue;

      // Check for discharge content eligibility
      const hasDischargeSummary = Array.isArray(caseData.discharge_summaries)
        ? caseData.discharge_summaries.length > 0
        : !!caseData.discharge_summaries;

      // Check for IDEXX Neo consultation notes
      const metadata = caseData.metadata as {
        idexx?: { consultation_notes?: string; notes?: string };
      } | null;
      const isIdexxSource =
        caseData.source === "idexx_neo" ||
        caseData.source === "idexx_extension";
      const hasIdexxNotes =
        isIdexxSource &&
        (Boolean(metadata?.idexx?.consultation_notes) ||
          Boolean(metadata?.idexx?.notes));

      // Check for transcriptions
      const transcriptions = caseData.transcriptions as Array<{
        id: string;
        transcript: string | null;
      }> | null;
      const hasTranscription = Array.isArray(transcriptions)
        ? transcriptions.some((t) => t.transcript && t.transcript.length > 50)
        : false;

      // Check for SOAP notes
      const soapNotes = caseData.soap_notes as Array<{
        id: string;
        subjective?: string | null;
        objective?: string | null;
        assessment?: string | null;
        plan?: string | null;
      }> | null;
      const hasSoapNotes = Array.isArray(soapNotes)
        ? soapNotes.some(
            (s) =>
              Boolean(s.subjective) ||
              Boolean(s.objective) ||
              Boolean(s.assessment) ||
              Boolean(s.plan),
          )
        : false;

      // Determine eligibility based on settings and content
      let isEligible = hasDischargeSummary; // Always include if has discharge summary

      // Include IDEXX cases with notes if enabled
      if (includeIdexxNotes && hasIdexxNotes) {
        isEligible = true;
      }

      // Include manual cases with transcriptions/SOAP if enabled
      if (includeManualTranscriptions && (hasTranscription || hasSoapNotes)) {
        isEligible = true;
      }

      if (!isEligible) continue;

      eligibleCases.push({
        id: caseData.id,
        patientId: patient.id,
        patientName: patient.name ?? "Unknown Patient",
        ownerName: patient.owner_name,
        ownerEmail: patient.owner_email,
        ownerPhone: patient.owner_phone,
        source: caseData.source,
        hasEmail,
        hasPhone,
        hasDischargeSummary,
        hasIdexxNotes,
        hasTranscription,
        hasSoapNotes,
        createdAt: caseData.created_at,
        scheduledAt: caseData.scheduled_at,
        // Email/Call status
        emailSent: hasScheduledEmail,
        callSent: hasScheduledCall,
      });
    }

    return eligibleCases;
  }),

  /**
   * Create a new discharge batch
   * Note: The discharge_batches table requires email_schedule_time and call_schedule_time as non-null.
   * We store emailsEnabled/callsEnabled in the metadata JSON column.
   */
  createDischargeBatch: protectedProcedure
    .input(
      z.object({
        caseIds: z.array(z.string().uuid()),
        emailScheduleTime: z.string().datetime().nullable(),
        callScheduleTime: z.string().datetime().nullable(),
        emailsEnabled: z.boolean().default(true),
        callsEnabled: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Default schedule times if not provided (required by DB schema)
      const now = new Date();
      const defaultEmailTime = new Date(
        now.getTime() + 24 * 60 * 60 * 1000,
      ).toISOString(); // +1 day
      const defaultCallTime = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString(); // +3 days

      // Create batch record
      const { data: batch, error: batchError } = await ctx.supabase
        .from("discharge_batches")
        .insert({
          user_id: ctx.user.id,
          status: "pending",
          total_cases: input.caseIds.length,
          // Use provided times or defaults (required by schema)
          email_schedule_time:
            input.emailsEnabled && input.emailScheduleTime
              ? input.emailScheduleTime
              : defaultEmailTime,
          call_schedule_time:
            input.callsEnabled && input.callScheduleTime
              ? input.callScheduleTime
              : defaultCallTime,
          // Store enabled flags in metadata JSON (columns don't exist in schema)
          metadata: {
            emailsEnabled: input.emailsEnabled,
            callsEnabled: input.callsEnabled,
          },
        })
        .select("id")
        .single();

      if (batchError ?? !batch) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create batch",
          cause: batchError,
        });
      }

      // Create batch items for each case
      const batchItems = input.caseIds.map((caseId) => ({
        batch_id: batch.id,
        case_id: caseId,
        status: "pending",
      }));

      const { error: itemsError } = await ctx.supabase
        .from("discharge_batch_items")
        .insert(batchItems);

      if (itemsError) {
        // Rollback batch creation
        await ctx.supabase
          .from("discharge_batches")
          .delete()
          .eq("id", batch.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create batch items",
          cause: itemsError,
        });
      }

      return { batchId: batch.id };
    }),

  /**
   * Get batch status and progress
   */
  getBatchStatus: protectedProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get batch details
      const { data: batch, error: batchError } = await ctx.supabase
        .from("discharge_batches")
        .select(
          `
          *,
          discharge_batch_items (
            id,
            case_id,
            status,
            email_scheduled,
            call_scheduled,
            error_message,
            processed_at
          )
        `,
        )
        .eq("id", input.batchId)
        .eq("user_id", ctx.user.id)
        .single();

      if (batchError ?? !batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      // Get case details for items
      const batchItems = batch.discharge_batch_items as Array<{
        id: string;
        case_id: string;
        status: string;
        email_scheduled: boolean | null;
        call_scheduled: boolean | null;
        error_message: string | null;
        processed_at: string | null;
      }>;
      const caseIds = batchItems.map((item) => item.case_id);
      const { data: cases } = await ctx.supabase
        .from("cases")
        .select(
          `
          id,
          patients (
            name
          )
        `,
        )
        .in("id", caseIds);

      // Map patient names to items
      const itemsWithDetails = batchItems.map((item) => {
        const caseData = cases?.find((c) => c.id === item.case_id);
        const patient = Array.isArray(caseData?.patients)
          ? caseData.patients[0]
          : caseData?.patients;

        return {
          ...item,
          patientName: patient?.name ?? "Unknown Patient",
        };
      });

      return {
        ...batch,
        discharge_batch_items: itemsWithDetails,
      };
    }),

  /**
   * Cancel a batch operation
   */
  cancelBatch: protectedProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("discharge_batches")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", input.batchId)
        .eq("user_id", ctx.user.id)
        .eq("status", "processing"); // Only cancel if still processing

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel batch",
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Get recent batch operations
   */
  getRecentBatches: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data: batches, error } = await ctx.supabase
        .from("discharge_batches")
        .select("*")
        .eq("user_id", ctx.user.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch batches",
          cause: error,
        });
      }

      return batches ?? [];
    }),
});

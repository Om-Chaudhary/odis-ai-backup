/**
 * Dashboard Listings Procedures
 *
 * Paginated lists of cases, calls, and emails.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { CallStatus } from "@odis-ai/shared/types";
import {
  getLocalDayRange,
  DEFAULT_TIMEZONE,
} from "@odis-ai/shared/util/timezone";
import {  type DynamicVariables } from "./types";
import {
  getClinicUserIds,
  getClinicBySlug,
  getClinicByUserId,
  userHasClinicAccess,
  getClinicUserIdsEnhanced,
  buildClinicScopeFilter,
} from "@odis-ai/domain/clinics";
import {
  fetchCasesBatch,
  fetchRelatedData,
  groupRelatedDataByCase,
  enrichCasesWithRelatedData,
  filterEnrichedCases,
  paginateResults,
} from "./listings-utils";

export const listingsRouter = createTRPCRouter({
  /**
   * Get all cases with pagination and filters
   */
  getAllCases: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(50).default(20),
        status: z
          .enum(["draft", "ongoing", "completed", "reviewed"])
          .optional(),
        source: z.string().optional(),
        search: z.string().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        missingDischarge: z.boolean().optional(),
        missingSoap: z.boolean().optional(),
        starred: z.boolean().optional(),
        clinicSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Validate and parse dates with timezone-aware boundaries
      let startIso: string | undefined;
      let endIso: string | undefined;

      if (input.startDate) {
        const testDate = new Date(input.startDate);
        if (isNaN(testDate.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid startDate format",
          });
        }
        const { startISO } = getLocalDayRange(
          input.startDate,
          DEFAULT_TIMEZONE,
        );
        startIso = startISO;
      }

      if (input.endDate) {
        const testDate = new Date(input.endDate);
        if (isNaN(testDate.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid endDate format",
          });
        }
        const { endISO } = getLocalDayRange(input.endDate, DEFAULT_TIMEZONE);
        endIso = endISO;
      }

      // Determine if we need post-filtering (fetch all cases then filter)
      // or if we can paginate directly at the database level
      const needsPostFiltering =
        input.missingDischarge === true || input.missingSoap === true;

      // Fetch cases from database
      const { cases, count } = await fetchCasesBatch(
        ctx.supabase,
        {
          clinicScopeFilter: buildClinicScopeFilter(clinic?.id, clinicUserIds),
          status: input.status,
          source: input.source,
          starred: input.starred,
          startIso,
          endIso,
        },
        {
          applyPagination: !needsPostFiltering,
          page: input.page,
          pageSize: input.pageSize,
        },
      );

      // Batch fetch all related data to avoid N+1 queries
      const caseIds = cases.map((c) => c.id);
      const relatedData = await fetchRelatedData(caseIds, ctx.supabase);

      // Group related data by case_id for efficient lookup
      const groupedData = groupRelatedDataByCase(relatedData);

      // Enrich cases with related data
      const enrichedCases = enrichCasesWithRelatedData(cases, groupedData);

      // Apply client-side filters (search, missing discharge, missing SOAP)
      const filteredCases = filterEnrichedCases(enrichedCases, {
        search: input.search,
        missingDischarge: input.missingDischarge,
        missingSoap: input.missingSoap,
      });

      // Calculate pagination
      const filteredTotal = needsPostFiltering
        ? filteredCases.length
        : (count ?? filteredCases.length);
      const totalPages = Math.ceil(filteredTotal / input.pageSize);

      // Apply pagination if we fetched all cases (post-filtering scenario)
      const paginatedCases = needsPostFiltering
        ? paginateResults(filteredCases, input.page, input.pageSize)
        : filteredCases;

      return {
        cases: paginatedCases,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: filteredTotal,
          totalPages,
        },
      };
    }),

  /**
   * Get VAPI call history with filtering and pagination
   */
  getCallHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(50).default(20),
        endReasonFilter: z
          .enum([
            "all",
            "successful",
            "voicemail",
            "no_answer",
            "busy",
            "failed",
          ])
          .optional()
          .default("all"),
        statusFilter: z
          .enum(["all", "completed", "queued", "in_progress", "failed"])
          .optional()
          .default("all"),
        clinicSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Build query with clinic-scoped filtering
      let query = ctx.supabase
        .from("scheduled_discharge_calls")
        .select(
          `
          id,
          status,
          scheduled_for,
          started_at,
          ended_at,
          ended_reason,
          duration_seconds,
          recording_url,
          transcript,
          cleaned_transcript,
          cost,
          customer_phone,
          vapi_call_id,
          case_id,
          created_at,
          dynamic_variables
        `,
          { count: "exact" },
        )
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .order("scheduled_for", { ascending: false, nullsFirst: false });

      // Apply status filter
      if (input.statusFilter !== "all") {
        query = query.eq("status", input.statusFilter);
      }

      const { data: calls, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch call history",
          cause: error,
        });
      }

      // Apply end reason filter (client-side for flexibility)
      let filteredCalls = calls ?? [];
      if (input.endReasonFilter !== "all") {
        filteredCalls = filteredCalls.filter((call) => {
          const endedReason = call.ended_reason;
          if (!endedReason || typeof endedReason !== "string") return false;
          const reason = endedReason.toLowerCase();

          switch (input.endReasonFilter) {
            case "successful":
              return [
                "assistant-ended-call",
                "customer-ended-call",
                "assistant-forwarded-call",
              ].includes(reason);
            case "voicemail":
              return reason === "voicemail";
            case "no_answer":
              return [
                "customer-did-not-answer",
                "dial-no-answer",
                "silence-timed-out",
              ].includes(reason);
            case "busy":
              return ["customer-busy", "dial-busy"].includes(reason);
            case "failed":
              return [
                "dial-failed",
                "assistant-error",
                "exceeded-max-duration",
              ].some((r) => reason.includes(r));
            default:
              return true;
          }
        });
      }

      // Fetch case info for each call to get patient names
      const caseIds = [
        ...new Set(
          filteredCalls
            .map((c) => c.case_id)
            .filter((id): id is string => id !== null),
        ),
      ];
      const casesMap = new Map<
        string,
        { patientName: string; ownerName: string }
      >();

      if (caseIds.length > 0) {
        const { data: cases } = await ctx.supabase
          .from("cases")
          .select(
            `
            id,
            patients (
              name,
              owner_name
            )
          `,
          )
          .in("id", caseIds);

        if (cases) {
          for (const c of cases) {
            const patient = Array.isArray(c.patients)
              ? c.patients[0]
              : c.patients;
            if (patient) {
              casesMap.set(c.id, {
                patientName: patient.name ?? "Unknown Patient",
                ownerName: patient.owner_name ?? "Unknown Owner",
              });
            }
          }
        }
      }

      // Apply pagination
      const totalFiltered = filteredCalls.length;
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize;
      const paginatedCalls = filteredCalls.slice(from, to);

      // Transform calls with patient info
      const transformedCalls = paginatedCalls.map((call) => {
        const caseInfo = call.case_id ? casesMap.get(call.case_id) : null;
        const dynamicVars = call.dynamic_variables as DynamicVariables | null;

        return {
          id: call.id,
          vapiCallId: call.vapi_call_id,
          caseId: call.case_id,
          status: call.status as CallStatus,
          scheduledFor: call.scheduled_for,
          startedAt: call.started_at,
          endedAt: call.ended_at,
          endedReason: call.ended_reason,
          durationSeconds: call.duration_seconds,
          recordingUrl: call.recording_url,
          hasTranscript: !!call.transcript,
          cost: call.cost,
          customerPhone: call.customer_phone,
          createdAt: call.created_at,
          patientName:
            caseInfo?.patientName ?? dynamicVars?.pet_name ?? "Unknown",
          ownerName:
            caseInfo?.ownerName ?? dynamicVars?.owner_name ?? "Unknown",
        };
      });

      return {
        calls: transformedCalls,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / input.pageSize),
        },
      };
    }),

  /**
   * Get email history with filtering and pagination
   */
  getEmailHistory: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(50).default(20),
        statusFilter: z
          .enum(["all", "queued", "sent", "failed", "cancelled"])
          .optional()
          .default("all"),
        clinicSlug: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Build query with clinic-scoped filtering
      let query = ctx.supabase
        .from("scheduled_discharge_emails")
        .select(
          `
          id,
          status,
          scheduled_for,
          sent_at,
          recipient_email,
          recipient_name,
          subject,
          case_id,
          created_at,
          resend_email_id,
          metadata
        `,
          { count: "exact" },
        )
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .order("scheduled_for", { ascending: false, nullsFirst: false });

      // Apply status filter
      if (input.statusFilter !== "all") {
        query = query.eq("status", input.statusFilter);
      }

      const { data: emails, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch email history",
          cause: error,
        });
      }

      // Fetch case info for each email to get patient names
      const caseIds = [
        ...new Set(
          (emails ?? [])
            .map((e) => e.case_id)
            .filter((id): id is string => id !== null),
        ),
      ];
      const casesMap = new Map<
        string,
        { patientName: string; ownerName: string }
      >();

      if (caseIds.length > 0) {
        const { data: cases } = await ctx.supabase
          .from("cases")
          .select(
            `
            id,
            patients (
              name,
              owner_name
            )
          `,
          )
          .in("id", caseIds);

        if (cases) {
          for (const c of cases) {
            const patient = Array.isArray(c.patients)
              ? c.patients[0]
              : c.patients;
            if (patient) {
              casesMap.set(c.id, {
                patientName: patient.name ?? "Unknown Patient",
                ownerName: patient.owner_name ?? "Unknown Owner",
              });
            }
          }
        }
      }

      // Apply pagination
      const filteredEmails = emails ?? [];
      const totalFiltered = filteredEmails.length;
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize;
      const paginatedEmails = filteredEmails.slice(from, to);

      // Transform emails with patient info
      const transformedEmails = paginatedEmails.map((email) => {
        const caseInfo = email.case_id ? casesMap.get(email.case_id) : null;

        return {
          id: email.id,
          caseId: email.case_id,
          status: email.status as
            | "queued"
            | "sent"
            | "failed"
            | "cancelled"
            | null,
          scheduledFor: email.scheduled_for,
          sentAt: email.sent_at,
          recipientEmail: email.recipient_email,
          recipientName: email.recipient_name,
          subject: email.subject,
          createdAt: email.created_at,
          resendEmailId: email.resend_email_id,
          patientName: caseInfo?.patientName ?? "Unknown",
          ownerName: caseInfo?.ownerName ?? "Unknown",
        };
      });

      return {
        emails: transformedEmails,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / input.pageSize),
        },
      };
    }),

  /**
   * Toggle starred status for a case
   */
  toggleStarred: protectedProcedure
    .input(
      z.object({
        caseId: z.string().uuid(),
        starred: z.boolean(),
        clinicSlug: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get clinic - either from slug or user's primary clinic
      let clinic;
      if (input.clinicSlug) {
        clinic = await getClinicBySlug(input.clinicSlug, ctx.supabase);
        if (!clinic) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Clinic not found",
          });
        }
        const hasAccess = await userHasClinicAccess(
          userId,
          clinic.id,
          ctx.supabase,
        );
        if (!hasAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this clinic",
          });
        }
      } else {
        clinic = await getClinicByUserId(userId, ctx.supabase);
      }

      // Get all users in the clinic for multi-clinic support
      const clinicUserIds = clinic?.id
        ? await getClinicUserIdsEnhanced(clinic.id, ctx.supabase)
        : await getClinicUserIds(userId, ctx.supabase);

      // Verify the case belongs to the clinic
      const { data: existingCase, error: fetchError } = await ctx.supabase
        .from("cases")
        .select("id, user_id, clinic_id")
        .eq("id", input.caseId)
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds))
        .single();

      if (fetchError || !existingCase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Case not found or access denied",
        });
      }

      // Update the starred status
      const { error: updateError } = await ctx.supabase
        .from("cases")
        .update({ is_starred: input.starred })
        .eq("id", input.caseId)
        .or(buildClinicScopeFilter(clinic?.id, clinicUserIds));

      if (updateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update case starred status",
          cause: updateError,
        });
      }

      return {
        success: true,
        caseId: input.caseId,
        starred: input.starred,
      };
    }),
});

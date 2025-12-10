/**
 * Dashboard Listings Procedures
 *
 * Paginated lists of cases, calls, and emails.
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { CallStatus } from "~/types/dashboard";
import {
  type SupabasePatientsResponse,
  type CaseWithPatients,
  type DynamicVariables,
} from "./types";

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
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Validate and parse dates
      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (input.startDate) {
        startDate = new Date(input.startDate);
        if (isNaN(startDate.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid startDate format",
          });
        }
      }

      if (input.endDate) {
        endDate = new Date(input.endDate);
        if (isNaN(endDate.getTime())) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid endDate format",
          });
        }
      }

      // Build base query
      let query = ctx.supabase
        .from("cases")
        .select(
          `
          id,
          status,
          source,
          type,
          created_at,
          scheduled_at,
          patients (
            id,
            name,
            species,
            owner_name
          )
        `,
          { count: "exact" },
        )
        .eq("user_id", userId);

      // Apply filters
      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.source) {
        query = query.eq("source", input.source);
      }

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      // If missingDischarge or missingSoap filters are active, we need to fetch all cases
      // to filter properly, then paginate. Otherwise, paginate first for better performance.
      const needsPostFiltering =
        input.missingDischarge === true || input.missingSoap === true;

      let cases: CaseWithPatients[] | null;
      let count: number | null = null;

      if (needsPostFiltering) {
        // Fetch all matching cases (we'll filter after enrichment)
        const { data: allCases, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch cases",
            cause: error,
          });
        }

        cases = allCases as CaseWithPatients[] | null;
      } else {
        // Apply pagination
        const from = (input.page - 1) * input.pageSize;
        const to = from + input.pageSize - 1;

        const {
          data: paginatedCases,
          error: queryError,
          count: queryCount,
        } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (queryError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch cases",
            cause: queryError,
          });
        }

        cases = paginatedCases as CaseWithPatients[] | null;
        count = queryCount;
      }

      // Batch fetch all related data to avoid N+1 queries
      const caseIds = (cases ?? []).map((c: CaseWithPatients) => c.id);

      const [
        { data: allSoapNotes },
        { data: allDischargeSummaries },
        { data: allCalls },
        { data: allEmails },
      ] = await Promise.all([
        caseIds.length > 0
          ? ctx.supabase
              .from("soap_notes")
              .select("case_id, id, created_at")
              .in("case_id", caseIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        caseIds.length > 0
          ? ctx.supabase
              .from("discharge_summaries")
              .select("case_id, id, created_at")
              .in("case_id", caseIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        caseIds.length > 0
          ? ctx.supabase
              .from("scheduled_discharge_calls")
              .select("case_id, id, created_at, ended_at")
              .in("case_id", caseIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        caseIds.length > 0
          ? ctx.supabase
              .from("scheduled_discharge_emails")
              .select("case_id, id, created_at, sent_at")
              .in("case_id", caseIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      // Group related data by case_id for efficient lookup
      type SoapNote = { case_id: string; id: string; created_at: string };
      type DischargeSummary = {
        case_id: string;
        id: string;
        created_at: string;
      };
      type Call = {
        case_id: string;
        id: string;
        created_at: string;
        ended_at: string | null;
      };
      type Email = {
        case_id: string;
        id: string;
        created_at: string;
        sent_at: string | null;
      };

      const soapNotesByCase = new Map<string, SoapNote>();
      const dischargeSummariesByCase = new Map<string, DischargeSummary>();
      const callsByCase = new Map<string, Call>();
      const emailsByCase = new Map<string, Email>();

      // Get latest entry for each case (data is already ordered by created_at desc)
      for (const note of (allSoapNotes ?? []) as SoapNote[]) {
        if (note?.case_id && !soapNotesByCase.has(note.case_id)) {
          soapNotesByCase.set(note.case_id, note);
        }
      }

      for (const summary of (allDischargeSummaries ??
        []) as DischargeSummary[]) {
        if (
          summary?.case_id &&
          !dischargeSummariesByCase.has(summary.case_id)
        ) {
          dischargeSummariesByCase.set(summary.case_id, summary);
        }
      }

      for (const call of (allCalls ?? []) as Call[]) {
        if (call?.case_id && !callsByCase.has(call.case_id)) {
          callsByCase.set(call.case_id, call);
        }
      }

      for (const email of (allEmails ?? []) as Email[]) {
        if (email?.case_id && !emailsByCase.has(email.case_id)) {
          emailsByCase.set(email.case_id, email);
        }
      }

      // Enrich cases with related data
      const enrichedCases = (cases ?? []).map((c: CaseWithPatients) => {
        const soapNote = soapNotesByCase.get(c.id);
        const dischargeSummary = dischargeSummariesByCase.get(c.id);
        const call = callsByCase.get(c.id);
        const email = emailsByCase.get(c.id);

        const patients = c.patients ?? [];
        const patient = patients[0];

        // Get latest timestamps (use ended_at for calls, sent_at for emails, created_at for others)
        const soapNoteTimestamp = soapNote?.created_at;
        const dischargeSummaryTimestamp = dischargeSummary?.created_at;
        const dischargeCallTimestamp = call?.ended_at ?? call?.created_at;
        const dischargeEmailTimestamp = email?.sent_at ?? email?.created_at;

        return {
          id: c.id,
          status: c.status,
          source: c.source,
          type: c.type,
          created_at: c.created_at,
          patient: {
            id: patient?.id ?? "",
            name: patient?.name ?? "Unknown",
            species: patient?.species ?? "Unknown",
            owner_name: patient?.owner_name ?? "Unknown",
          },
          hasSoapNote: !!soapNote,
          hasDischargeSummary: !!dischargeSummary,
          hasDischargeCall: !!call,
          hasDischargeEmail: !!email,
          soapNoteTimestamp,
          dischargeSummaryTimestamp,
          dischargeCallTimestamp,
          dischargeEmailTimestamp,
        };
      });

      // Apply client-side filters (search, missing discharge, missing SOAP)
      let filteredCases = enrichedCases;
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredCases = filteredCases.filter(
          (c: (typeof enrichedCases)[0]) =>
            c.patient.name.toLowerCase().includes(searchLower) ||
            (c.patient.owner_name?.toLowerCase() ?? "").includes(searchLower),
        );
      }

      // Apply missing discharge filter
      if (input.missingDischarge === true) {
        filteredCases = filteredCases.filter(
          (c: (typeof enrichedCases)[0]) => !c.hasDischargeSummary,
        );
      }

      // Apply missing SOAP filter
      if (input.missingSoap === true) {
        filteredCases = filteredCases.filter(
          (c: (typeof enrichedCases)[0]) => !c.hasSoapNote,
        );
      }

      // Calculate pagination
      // When not doing post-filtering, use the count from the query
      // When doing post-filtering, use the length of filtered cases
      const filteredTotal = needsPostFiltering
        ? filteredCases.length
        : (count ?? filteredCases.length);
      let paginatedCases = filteredCases;
      const totalPages = Math.ceil(filteredTotal / input.pageSize);

      // Apply pagination if we fetched all cases (post-filtering scenario)
      if (needsPostFiltering) {
        const from = (input.page - 1) * input.pageSize;
        const to = from + input.pageSize;
        paginatedCases = filteredCases.slice(from, to);
      }

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
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Build query
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
          cost,
          customer_phone,
          vapi_call_id,
          case_id,
          created_at,
          dynamic_variables
        `,
          { count: "exact" },
        )
        .eq("user_id", userId)
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
        ...new Set(filteredCalls.map((c) => c.case_id).filter(Boolean)),
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Build query
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
        .eq("user_id", userId)
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
        ...new Set((emails ?? []).map((e) => e.case_id).filter(Boolean)),
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
});

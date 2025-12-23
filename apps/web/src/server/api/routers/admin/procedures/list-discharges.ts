/**
 * List Discharges Procedures
 *
 * Returns paginated lists of scheduled calls and emails.
 */

import { TRPCError } from "@trpc/server";
import { createServiceClient } from "@odis-ai/db/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import { listScheduledCallsInput, listScheduledEmailsInput } from "../schemas";

export const listDischargesRouter = createTRPCRouter({
  listScheduledCalls: adminProcedure
    .input(listScheduledCallsInput)
    .query(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        let query = supabase.from("scheduled_discharge_calls").select(
          `
            id,
            case_id,
            user_id,
            vapi_call_id,
            status,
            customer_phone,
            scheduled_for,
            started_at,
            ended_at,
            duration_seconds,
            ended_reason,
            transcript,
            summary,
            attention_types,
            attention_severity,
            attention_flagged_at,
            attention_summary,
            recording_url,
            created_at,
            updated_at,
            cases (
              id,
              type,
              status,
              patients (
                id,
                name,
                owner_name
              )
            ),
            users (
              id,
              email,
              clinic_name
            )
          `,
          { count: "exact" },
        );

        // Apply user filter
        if (input.userId) {
          query = query.eq("user_id", input.userId);
        }

        // Apply status filter
        if (input.status) {
          query = query.eq("status", input.status);
        }

        // Apply attention filter
        if (input.hasAttention === true) {
          query = query.not("attention_types", "is", null);
        } else if (input.hasAttention === false) {
          query = query.is("attention_types", null);
        }

        // Apply date filters
        if (input.startDate) {
          query = query.gte("created_at", input.startDate);
        }
        if (input.endDate) {
          query = query.lte("created_at", input.endDate);
        }

        // Apply sorting
        query = query.order(input.sortBy, {
          ascending: input.sortOrder === "asc",
          nullsFirst: false,
        });

        // Apply pagination
        const from = (input.page - 1) * input.pageSize;
        const to = from + input.pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        // Transform and filter by search
        // Type assertions for Supabase join results
        type CaseJoin = {
          id: string;
          type: string | null;
          status: string | null;
          patients: Array<{
            id: string;
            name: string;
            owner_name: string | null;
          }>;
        } | null;
        type UserJoin = {
          id: string;
          email: string;
          clinic_name: string | null;
        } | null;

        let calls = (data ?? []).map((call) => {
          const caseData = (Array.isArray(call.cases)
            ? call.cases[0]
            : call.cases) as unknown as CaseJoin;
          const patient = caseData?.patients?.[0];
          const userRaw = (Array.isArray(call.users)
            ? call.users[0]
            : call.users) as unknown as UserJoin;
          return {
            id: call.id,
            caseId: call.case_id,
            userId: call.user_id,
            vapiCallId: call.vapi_call_id,
            status: call.status,
            customerPhone: call.customer_phone,
            scheduledFor: call.scheduled_for,
            startedAt: call.started_at,
            endedAt: call.ended_at,
            durationSeconds: call.duration_seconds,
            endedReason: call.ended_reason,
            transcript: call.transcript,
            summary: call.summary,
            attentionTypes: call.attention_types,
            attentionSeverity: call.attention_severity,
            attentionFlaggedAt: call.attention_flagged_at,
            attentionSummary: call.attention_summary,
            recordingUrl: call.recording_url,
            createdAt: call.created_at,
            updatedAt: call.updated_at,
            case: caseData
              ? {
                  id: caseData.id,
                  type: caseData.type,
                  status: caseData.status,
                }
              : null,
            patient: patient
              ? {
                  id: patient.id,
                  name: patient.name,
                  ownerName: patient.owner_name,
                }
              : null,
            user: userRaw
              ? {
                  id: userRaw.id,
                  email: userRaw.email,
                  clinicName: userRaw.clinic_name,
                }
              : null,
          };
        });

        // Apply search filter
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          const matchesSearch = (value: string | null | undefined): boolean =>
            Boolean(value?.toLowerCase().includes(searchLower));
          calls = calls.filter(
            (c) =>
              matchesSearch(c.patient?.name) ||
              matchesSearch(c.patient?.ownerName) ||
              matchesSearch(c.user?.email) ||
              matchesSearch(c.user?.clinicName) ||
              matchesSearch(c.customerPhone) ||
              matchesSearch(c.id),
          );
        }

        return {
          calls,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / input.pageSize),
          },
        };
      } catch (error) {
        console.error("[Admin List Calls] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch scheduled calls",
        });
      }
    }),

  listScheduledEmails: adminProcedure
    .input(listScheduledEmailsInput)
    .query(async ({ input }) => {
      const supabase = await createServiceClient();

      try {
        let query = supabase.from("scheduled_discharge_emails").select(
          `
            id,
            case_id,
            user_id,
            status,
            recipient_email,
            recipient_name,
            subject,
            scheduled_for,
            sent_at,
            resend_email_id,
            created_at,
            updated_at,
            cases (
              id,
              type,
              status,
              patients (
                id,
                name,
                owner_name
              )
            ),
            users (
              id,
              email,
              clinic_name
            )
          `,
          { count: "exact" },
        );

        // Apply user filter
        if (input.userId) {
          query = query.eq("user_id", input.userId);
        }

        // Apply status filter
        if (input.status) {
          query = query.eq("status", input.status);
        }

        // Apply date filters
        if (input.startDate) {
          query = query.gte("created_at", input.startDate);
        }
        if (input.endDate) {
          query = query.lte("created_at", input.endDate);
        }

        // Apply sorting
        query = query.order(input.sortBy, {
          ascending: input.sortOrder === "asc",
          nullsFirst: false,
        });

        // Apply pagination
        const from = (input.page - 1) * input.pageSize;
        const to = from + input.pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        // Transform and filter by search
        // Type assertions for Supabase join results
        type EmailCaseJoin = {
          id: string;
          type: string | null;
          status: string | null;
          patients: Array<{
            id: string;
            name: string;
            owner_name: string | null;
          }>;
        } | null;
        type EmailUserJoin = {
          id: string;
          email: string;
          clinic_name: string | null;
        } | null;

        let emails = (data ?? []).map((email) => {
          const caseData = (Array.isArray(email.cases)
            ? email.cases[0]
            : email.cases) as unknown as EmailCaseJoin;
          const patient = caseData?.patients?.[0];
          const userRaw = (Array.isArray(email.users)
            ? email.users[0]
            : email.users) as unknown as EmailUserJoin;
          return {
            id: email.id,
            caseId: email.case_id,
            userId: email.user_id,
            status: email.status,
            recipientEmail: email.recipient_email,
            recipientName: email.recipient_name,
            subject: email.subject,
            scheduledFor: email.scheduled_for,
            sentAt: email.sent_at,
            resendEmailId: email.resend_email_id,
            createdAt: email.created_at,
            updatedAt: email.updated_at,
            case: caseData
              ? {
                  id: caseData.id,
                  type: caseData.type,
                  status: caseData.status,
                }
              : null,
            patient: patient
              ? {
                  id: patient.id,
                  name: patient.name,
                  ownerName: patient.owner_name,
                }
              : null,
            user: userRaw
              ? {
                  id: userRaw.id,
                  email: userRaw.email,
                  clinicName: userRaw.clinic_name,
                }
              : null,
          };
        });

        // Apply search filter
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          const matchesSearch = (value: string | null | undefined): boolean =>
            Boolean(value?.toLowerCase().includes(searchLower));
          emails = emails.filter(
            (e) =>
              matchesSearch(e.patient?.name) ||
              matchesSearch(e.patient?.ownerName) ||
              matchesSearch(e.user?.email) ||
              matchesSearch(e.user?.clinicName) ||
              matchesSearch(e.recipientEmail) ||
              matchesSearch(e.id),
          );
        }

        return {
          emails,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total: count ?? 0,
            totalPages: Math.ceil((count ?? 0) / input.pageSize),
          },
        };
      } catch (error) {
        console.error("[Admin List Emails] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch scheduled emails",
        });
      }
    }),
});

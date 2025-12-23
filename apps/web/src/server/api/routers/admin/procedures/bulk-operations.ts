/**
 * Bulk Operations Procedures
 *
 * Admin bulk operations for cases, calls, and emails.
 */

import { TRPCError } from "@trpc/server";
import { createServiceClient } from "@odis-ai/db/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { adminProcedure } from "../middleware";
import {
  bulkUpdateCasesInput,
  bulkDeleteCasesInput,
  bulkCancelDischargesInput,
  bulkRescheduleInput,
} from "../schemas";

export const bulkOperationsRouter = createTRPCRouter({
  bulkUpdateCases: adminProcedure
    .input(bulkUpdateCasesInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServiceClient();

      try {
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (input.updates.status !== undefined) {
          updateData.status = input.updates.status;
        }
        if (input.updates.isStarred !== undefined) {
          updateData.is_starred = input.updates.isStarred;
        }
        if (input.updates.isUrgent !== undefined) {
          updateData.is_urgent = input.updates.isUrgent;
        }

        const { data, error } = await supabase
          .from("cases")
          .update(updateData)
          .in("id", input.caseIds)
          .select("id");

        if (error) throw error;

        // Log admin action
        console.log(
          `[Admin Bulk Update] User ${ctx.user!.id} updated ${data?.length ?? 0} cases`,
          { caseIds: input.caseIds, updates: input.updates },
        );

        return {
          success: true,
          updatedCount: data?.length ?? 0,
        };
      } catch (error) {
        console.error("[Admin Bulk Update Cases] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update cases",
        });
      }
    }),

  bulkDeleteCases: adminProcedure
    .input(bulkDeleteCasesInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServiceClient();

      try {
        // First, delete related records in order of dependencies
        // 1. Delete scheduled calls
        await supabase
          .from("scheduled_discharge_calls")
          .delete()
          .in("case_id", input.caseIds);

        // 2. Delete scheduled emails
        await supabase
          .from("scheduled_discharge_emails")
          .delete()
          .in("case_id", input.caseIds);

        // 3. Delete discharge summaries
        await supabase
          .from("discharge_summaries")
          .delete()
          .in("case_id", input.caseIds);

        // 4. Delete SOAP notes
        await supabase
          .from("soap_notes")
          .delete()
          .in("case_id", input.caseIds);

        // 5. Delete transcriptions
        await supabase
          .from("transcriptions")
          .delete()
          .in("case_id", input.caseIds);

        // 6. Delete patients
        await supabase
          .from("patients")
          .delete()
          .in("case_id", input.caseIds);

        // 7. Finally, delete the cases
        const { data, error } = await supabase
          .from("cases")
          .delete()
          .in("id", input.caseIds)
          .select("id");

        if (error) throw error;

        // Log admin action
        console.log(
          `[Admin Bulk Delete] User ${ctx.user!.id} deleted ${data?.length ?? 0} cases`,
          { caseIds: input.caseIds },
        );

        return {
          success: true,
          deletedCount: data?.length ?? 0,
        };
      } catch (error) {
        console.error("[Admin Bulk Delete Cases] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete cases",
        });
      }
    }),

  bulkCancelDischarges: adminProcedure
    .input(bulkCancelDischargesInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServiceClient();

      try {
        let cancelledCalls = 0;
        let cancelledEmails = 0;

        // Cancel calls
        if (input.callIds && input.callIds.length > 0) {
          const { data } = await supabase
            .from("scheduled_discharge_calls")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .in("id", input.callIds)
            .in("status", ["queued", "ringing"]) // Only cancel pending calls
            .select("id");

          cancelledCalls = data?.length ?? 0;
        }

        // Cancel emails
        if (input.emailIds && input.emailIds.length > 0) {
          const { data } = await supabase
            .from("scheduled_discharge_emails")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .in("id", input.emailIds)
            .eq("status", "queued") // Only cancel pending emails
            .select("id");

          cancelledEmails = data?.length ?? 0;
        }

        // Log admin action
        console.log(
          `[Admin Bulk Cancel] User ${ctx.user!.id} cancelled ${cancelledCalls} calls and ${cancelledEmails} emails`,
          { callIds: input.callIds, emailIds: input.emailIds },
        );

        return {
          success: true,
          cancelledCount: cancelledCalls + cancelledEmails,
          cancelledCalls,
          cancelledEmails,
        };
      } catch (error) {
        console.error("[Admin Bulk Cancel] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to cancel discharges",
        });
      }
    }),

  bulkReschedule: adminProcedure
    .input(bulkRescheduleInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = await createServiceClient();

      try {
        let rescheduledCalls = 0;
        let rescheduledEmails = 0;

        // Reschedule calls
        if (input.callIds && input.callIds.length > 0) {
          const { data } = await supabase
            .from("scheduled_discharge_calls")
            .update({
              scheduled_for: input.scheduledFor,
              status: "queued",
              updated_at: new Date().toISOString(),
            })
            .in("id", input.callIds)
            .in("status", ["queued", "failed"]) // Can reschedule pending or failed
            .select("id");

          rescheduledCalls = data?.length ?? 0;
        }

        // Reschedule emails
        if (input.emailIds && input.emailIds.length > 0) {
          const { data } = await supabase
            .from("scheduled_discharge_emails")
            .update({
              scheduled_for: input.scheduledFor,
              status: "queued",
              updated_at: new Date().toISOString(),
            })
            .in("id", input.emailIds)
            .in("status", ["queued", "failed"]) // Can reschedule pending or failed
            .select("id");

          rescheduledEmails = data?.length ?? 0;
        }

        // Log admin action
        console.log(
          `[Admin Bulk Reschedule] User ${ctx.user!.id} rescheduled ${rescheduledCalls} calls and ${rescheduledEmails} emails to ${input.scheduledFor}`,
        );

        return {
          success: true,
          rescheduledCalls,
          rescheduledEmails,
        };
      } catch (error) {
        console.error("[Admin Bulk Reschedule] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reschedule discharges",
        });
      }
    }),
});

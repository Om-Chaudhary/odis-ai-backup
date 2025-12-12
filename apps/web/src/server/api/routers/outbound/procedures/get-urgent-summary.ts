/**
 * Get Urgent Summary Procedure
 *
 * Generates (or retrieves cached) LLM summary explaining why a call was flagged as urgent.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { generateUrgentSummary } from "@odis-ai/ai";

const getUrgentSummaryInput = z.object({
  callId: z.string().uuid(),
});

export const getUrgentSummaryRouter = createTRPCRouter({
  getUrgentSummary: protectedProcedure
    .input(getUrgentSummaryInput)
    .query(async ({ ctx, input }) => {
      // Fetch the call record
      const { data: call, error: fetchError } = await ctx.supabase
        .from("scheduled_discharge_calls")
        .select("id, transcript, urgent_reason_summary, structured_data")
        .eq("id", input.callId)
        .single();

      if (fetchError || !call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      // Check if call is actually flagged as urgent
      const structuredData = call.structured_data as {
        urgent_case?: boolean;
      } | null;
      if (!structuredData?.urgent_case) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This call is not flagged as urgent",
        });
      }

      // Return cached summary if available
      if (call.urgent_reason_summary) {
        return {
          summary: call.urgent_reason_summary,
          cached: true,
        };
      }

      // Generate summary if transcript is available
      if (!call.transcript) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No transcript available to generate urgent summary",
        });
      }

      try {
        const summary = await generateUrgentSummary({
          transcript: call.transcript,
        });

        // Cache the summary in the database
        const { error: updateError } = await ctx.supabase
          .from("scheduled_discharge_calls")
          .update({ urgent_reason_summary: summary })
          .eq("id", input.callId);

        if (updateError) {
          console.error(
            "[URGENT_SUMMARY] Failed to cache summary:",
            updateError,
          );
          // Still return the summary even if caching fails
        }

        return {
          summary,
          cached: false,
        };
      } catch (error) {
        console.error("[URGENT_SUMMARY] Failed to generate summary:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate urgent summary",
        });
      }
    }),
});

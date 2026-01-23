/**
 * VAPI Sync Procedures
 *
 * Procedures for fetching and syncing call data from VAPI API:
 * - Fetch call from VAPI
 * - Get call data for appointment
 * - Sync call from VAPI
 * - Batch sync from VAPI
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getUserWithClinic, isAdminOrOwner } from "./helpers";
import {
  fetchCallFromVAPIInput,
  getCallDataForAppointmentInput,
  syncCallFromVAPIInput,
  batchSyncFromVAPIInput,
} from "./schemas";

export const syncRouter = createTRPCRouter({
  /**
   * Fetch call data directly from VAPI API
   * Used as fallback when database data is incomplete (e.g., missing recording_url)
   */
  fetchCallFromVAPI: protectedProcedure
    .input(fetchCallFromVAPIInput)
    .query(async ({ input }) => {
      try {
        const { getCall, vapiRequestQueue } =
          await import("@odis-ai/integrations/vapi");
        const callData = await vapiRequestQueue.enqueue(() =>
          getCall(input.vapiCallId),
        );

        console.log("[FETCH_CALL_FROM_VAPI] Successfully fetched call data", {
          callId: input.vapiCallId,
          status: callData.status,
          hasRecording: !!callData.recordingUrl,
          hasTranscript: !!callData.transcript,
          hasSummary: !!callData.analysis?.summary,
        });

        return {
          id: callData.id,
          status: callData.status,
          recordingUrl: callData.recordingUrl,
          transcript: callData.transcript,
          messages: callData.messages,
          analysis: callData.analysis,
          startedAt: callData.startedAt,
          endedAt: callData.endedAt,
          duration:
            callData.endedAt && callData.startedAt
              ? Math.floor(
                  (new Date(callData.endedAt).getTime() -
                    new Date(callData.startedAt).getTime()) /
                    1000,
                )
              : null,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const isRateLimit =
          errorMessage.includes("Rate limit exceeded") ||
          errorMessage.includes("rate limit") ||
          errorMessage.includes("429");

        console.error("[FETCH_CALL_FROM_VAPI] Error fetching call data:", {
          callId: input.vapiCallId,
          error: errorMessage,
          isRateLimit,
        });

        if (isRateLimit) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "VAPI rate limit exceeded. Please try again in a few moments.",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to fetch call data: ${error.message}`
              : "Failed to fetch call data from VAPI",
        });
      }
    }),

  /**
   * Get call data for an appointment - fetches from database first, then VAPI API
   * Optimized for AppointmentDetail component to show recording and transcript
   */
  getCallDataForAppointment: protectedProcedure
    .input(getCallDataForAppointmentInput)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data: dbCall, error: dbError } = await supabase
        .from("inbound_vapi_calls")
        .select(
          "id, vapi_call_id, recording_url, stereo_recording_url, transcript, summary, duration_seconds, status, started_at, ended_at, call_analysis, display_transcript, use_display_transcript",
        )
        .eq("vapi_call_id", input.vapiCallId)
        .single();

      if (!dbError && dbCall) {
        const hasRecording = !!dbCall.recording_url;
        const hasTranscript = !!dbCall.transcript;

        const effectiveTranscript =
          dbCall.use_display_transcript && dbCall.display_transcript
            ? dbCall.display_transcript
            : dbCall.transcript;

        console.log("[GET_CALL_FOR_APPOINTMENT] Found call in database", {
          vapiCallId: input.vapiCallId,
          hasRecording,
          hasTranscript,
          hasSummary: !!dbCall.summary,
          usingDisplayTranscript: dbCall.use_display_transcript,
        });

        if (hasRecording && hasTranscript) {
          return {
            id: dbCall.vapi_call_id,
            source: "database" as const,
            status: dbCall.status,
            recordingUrl: dbCall.recording_url,
            stereoRecordingUrl: dbCall.stereo_recording_url,
            transcript: effectiveTranscript,
            summary: dbCall.summary,
            analysis: dbCall.call_analysis as Record<string, unknown> | null,
            startedAt: dbCall.started_at,
            endedAt: dbCall.ended_at,
            duration: dbCall.duration_seconds,
            displayTranscript: dbCall.display_transcript,
            useDisplayTranscript: dbCall.use_display_transcript,
          };
        }

        console.log(
          "[GET_CALL_FOR_APPOINTMENT] DB missing data, fetching from VAPI",
          {
            vapiCallId: input.vapiCallId,
            hasRecording,
            hasTranscript,
          },
        );
      }

      try {
        const { getCall } = await import("@odis-ai/integrations/vapi");
        const callData = await getCall(input.vapiCallId);

        console.log("[GET_CALL_FOR_APPOINTMENT] Fetched from VAPI API", {
          vapiCallId: input.vapiCallId,
          hasRecording: !!callData.recordingUrl,
          hasTranscript: !!callData.transcript,
        });

        return {
          id: callData.id,
          source: "vapi" as const,
          status: callData.status,
          recordingUrl: callData.recordingUrl,
          stereoRecordingUrl: null,
          transcript: callData.transcript,
          summary: callData.analysis?.summary ?? null,
          analysis: callData.analysis as Record<string, unknown> | null,
          startedAt: callData.startedAt,
          endedAt: callData.endedAt,
          duration:
            callData.endedAt && callData.startedAt
              ? Math.floor(
                  (new Date(callData.endedAt).getTime() -
                    new Date(callData.startedAt).getTime()) /
                    1000,
                )
              : null,
        };
      } catch (error) {
        console.error("[GET_CALL_FOR_APPOINTMENT] Error fetching from VAPI:", {
          vapiCallId: input.vapiCallId,
          error: error instanceof Error ? error.message : String(error),
        });

        if (dbCall) {
          const effectiveTranscript =
            dbCall.use_display_transcript && dbCall.display_transcript
              ? dbCall.display_transcript
              : dbCall.transcript;

          return {
            id: dbCall.vapi_call_id,
            source: "database" as const,
            status: dbCall.status,
            recordingUrl: dbCall.recording_url,
            stereoRecordingUrl: dbCall.stereo_recording_url,
            transcript: effectiveTranscript,
            summary: dbCall.summary,
            analysis: dbCall.call_analysis as Record<string, unknown> | null,
            startedAt: dbCall.started_at,
            endedAt: dbCall.ended_at,
            duration: dbCall.duration_seconds,
            displayTranscript: dbCall.display_transcript,
            useDisplayTranscript: dbCall.use_display_transcript,
          };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to fetch call data: ${error.message}`
              : "Failed to fetch call data",
        });
      }
    }),

  /**
   * Sync call data from VAPI API and update database
   * Used when webhook data is missing or incomplete
   */
  syncCallFromVAPI: protectedProcedure
    .input(syncCallFromVAPIInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const { data: existingCall, error: fetchError } = await supabase
        .from("inbound_vapi_calls")
        .select("*")
        .eq("id", input.id)
        .single();

      if (fetchError || !existingCall) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      const { data: user } = await supabase
        .from("users")
        .select("role, clinic_name")
        .eq("id", ctx.user.id)
        .single();

      const isAdmin = user?.role === "admin" || user?.role === "practice_owner";
      if (!isAdmin && existingCall.clinic_name !== user?.clinic_name) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this call",
        });
      }

      if (!existingCall.vapi_call_id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Call does not have a VAPI call ID",
        });
      }

      const needsSync =
        input.forceUpdate ||
        !existingCall.recording_url ||
        !existingCall.transcript ||
        !existingCall.call_analysis;

      if (!needsSync) {
        return {
          synced: false,
          message: "Call data is already complete",
          fieldsUpdated: [],
        };
      }

      try {
        const { getCall } = await import("@odis-ai/integrations/vapi");
        const vapiCall = await getCall(existingCall.vapi_call_id);

        console.log("[SYNC_CALL_FROM_VAPI] Fetched call data from VAPI", {
          callId: existingCall.vapi_call_id,
          hasRecording: !!vapiCall.recordingUrl,
          hasTranscript: !!vapiCall.transcript,
          hasAnalysis: !!vapiCall.analysis,
        });

        const updateData: Record<string, unknown> = {};
        const fieldsUpdated: string[] = [];

        if (
          vapiCall.recordingUrl &&
          (!existingCall.recording_url || input.forceUpdate)
        ) {
          updateData.recording_url = vapiCall.recordingUrl;
          fieldsUpdated.push("recording_url");
        }

        if (
          vapiCall.transcript &&
          (!existingCall.transcript || input.forceUpdate)
        ) {
          updateData.transcript = vapiCall.transcript;
          fieldsUpdated.push("transcript");
        }

        if (
          vapiCall.messages &&
          (!existingCall.transcript_messages || input.forceUpdate)
        ) {
          updateData.transcript_messages = vapiCall.messages;
          fieldsUpdated.push("transcript_messages");
        }

        if (
          vapiCall.analysis &&
          (!existingCall.call_analysis || input.forceUpdate)
        ) {
          updateData.call_analysis = vapiCall.analysis;
          if (vapiCall.analysis.summary) {
            updateData.summary = vapiCall.analysis.summary;
            fieldsUpdated.push("summary");
          }
          if (vapiCall.analysis.successEvaluation) {
            updateData.success_evaluation = vapiCall.analysis.successEvaluation;
            fieldsUpdated.push("success_evaluation");
          }
          fieldsUpdated.push("call_analysis");
        }

        if (
          vapiCall.startedAt &&
          vapiCall.endedAt &&
          (!existingCall.duration_seconds || input.forceUpdate)
        ) {
          const duration = Math.floor(
            (new Date(vapiCall.endedAt).getTime() -
              new Date(vapiCall.startedAt).getTime()) /
              1000,
          );
          updateData.duration_seconds = duration;
          updateData.started_at = vapiCall.startedAt;
          updateData.ended_at = vapiCall.endedAt;
          fieldsUpdated.push("duration_seconds");
        }

        if (vapiCall.costs && (!existingCall.cost || input.forceUpdate)) {
          const totalCost = vapiCall.costs.reduce(
            (sum, c) => sum + (c.amount ?? 0),
            0,
          );
          updateData.cost = totalCost;
          fieldsUpdated.push("cost");
        }

        if (Object.keys(updateData).length === 0) {
          return {
            synced: false,
            message: "No new data available from VAPI",
            fieldsUpdated: [],
          };
        }

        const { error: updateError } = await supabase
          .from("inbound_vapi_calls")
          .update(updateData)
          .eq("id", input.id);

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update call: ${updateError.message}`,
          });
        }

        console.log("[SYNC_CALL_FROM_VAPI] Successfully synced call data", {
          callId: existingCall.vapi_call_id,
          fieldsUpdated,
        });

        return {
          synced: true,
          message: `Successfully synced ${fieldsUpdated.length} field(s)`,
          fieldsUpdated,
        };
      } catch (error) {
        console.error("[SYNC_CALL_FROM_VAPI] Error syncing call data:", {
          callId: existingCall.vapi_call_id,
          error: error instanceof Error ? error.message : String(error),
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? `Failed to sync call data: ${error.message}`
              : "Failed to sync call data from VAPI",
        });
      }
    }),

  /**
   * Batch sync multiple calls from VAPI API
   * Used to backfill missing data for multiple calls
   */
  batchSyncFromVAPI: protectedProcedure
    .input(batchSyncFromVAPIInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const user = await getUserWithClinic(supabase, ctx.user.id);

      if (!isAdminOrOwner(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Batch sync requires admin access",
        });
      }

      const { data: calls, error: fetchError } = await supabase
        .from("inbound_vapi_calls")
        .select("id, vapi_call_id, recording_url, transcript, call_analysis")
        .in("id", input.ids);

      if (fetchError || !calls) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch calls",
        });
      }

      const { getCall } = await import("@odis-ai/integrations/vapi");

      const results: Array<{
        id: string;
        status: "synced" | "skipped" | "failed";
        fieldsUpdated?: string[];
        error?: string;
      }> = [];

      for (const call of calls) {
        if (!call.vapi_call_id) {
          results.push({
            id: call.id,
            status: "skipped",
            error: "No VAPI call ID",
          });
          continue;
        }

        const needsSync =
          input.forceUpdate ||
          !call.recording_url ||
          !call.transcript ||
          !call.call_analysis;

        if (!needsSync) {
          results.push({
            id: call.id,
            status: "skipped",
          });
          continue;
        }

        try {
          const vapiCall = await getCall(call.vapi_call_id);

          const updateData: Record<string, unknown> = {};
          const fieldsUpdated: string[] = [];

          if (
            vapiCall.recordingUrl &&
            (!call.recording_url || input.forceUpdate)
          ) {
            updateData.recording_url = vapiCall.recordingUrl;
            fieldsUpdated.push("recording_url");
          }

          if (vapiCall.transcript && (!call.transcript || input.forceUpdate)) {
            updateData.transcript = vapiCall.transcript;
            fieldsUpdated.push("transcript");
          }

          if (vapiCall.analysis && (!call.call_analysis || input.forceUpdate)) {
            updateData.call_analysis = vapiCall.analysis;
            if (vapiCall.analysis.summary) {
              updateData.summary = vapiCall.analysis.summary;
            }
            fieldsUpdated.push("call_analysis");
          }

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from("inbound_vapi_calls")
              .update(updateData)
              .eq("id", call.id);

            results.push({
              id: call.id,
              status: "synced",
              fieldsUpdated,
            });
          } else {
            results.push({
              id: call.id,
              status: "skipped",
            });
          }

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          results.push({
            id: call.id,
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const synced = results.filter((r) => r.status === "synced").length;
      const skipped = results.filter((r) => r.status === "skipped").length;
      const failed = results.filter((r) => r.status === "failed").length;

      console.log("[BATCH_SYNC_FROM_VAPI] Batch sync completed", {
        total: input.ids.length,
        synced,
        skipped,
        failed,
      });

      return {
        total: input.ids.length,
        synced,
        skipped,
        failed,
        results,
      };
    }),
});

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { createClient } from "@odis-ai/db/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const callStatusEnum = z.enum([
  "queued",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);

const userSentimentEnum = z.enum(["positive", "neutral", "negative"]);

const listInboundCallsInput = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(5).max(100).default(20),
  status: callStatusEnum.optional(),
  sentiment: userSentimentEnum.optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  clinicName: z.string().optional(),
  assistantId: z.string().optional(),
  search: z.string().optional(), // Search by phone number or transcript
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user with clinic information
 * Extracted to avoid duplication across procedures
 */
async function getUserWithClinic(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, clinic_name")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to fetch user information",
    });
  }

  return user;
}

/**
 * Apply role-based filtering to query
 * Prevents SQL injection by using parameterized queries (Supabase handles escaping)
 */
function applyRoleBasedFilter(
  query: ReturnType<SupabaseClient<unknown>["from"]>,
  user: { id: string; role: string | null; clinic_name: string | null },
) {
  const isAdminOrOwner =
    user.role === "admin" || user.role === "practice_owner";

  if (!isAdminOrOwner) {
    // Regular users: see calls for their clinic OR calls assigned to them
    // Use .or() with proper parameterized values (Supabase escapes these)
    if (user.clinic_name) {
      // Both clinic_name and user_id are parameterized by Supabase
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      query = query.or(
        `clinic_name.eq."${user.clinic_name}",user_id.eq.${user.id}`,
      );
    } else {
      // Only filter by user_id if no clinic_name
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      query = query.eq("user_id", user.id);
    }
  } else if (user.clinic_name) {
    // Admins/practice owners see all calls for their clinic
    // clinic_name is parameterized by Supabase
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    query = query.eq("clinic_name", user.clinic_name);
  }

  return query;
}

// ============================================================================
// ROUTER
// ============================================================================

export const inboundCallsRouter = createTRPCRouter({
  /**
   * List inbound calls with filters and pagination
   * Role-based access: admins/practice_owners see clinic-wide, others see their own
   */
  listInboundCalls: protectedProcedure
    .input(listInboundCallsInput)
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's role and clinic
      const user = await getUserWithClinic(supabase, ctx.user.id);

      // Build query - sort by created_at descending (most recent first)
      let query = supabase
        .from("inbound_vapi_calls")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply role-based filtering (prevents SQL injection)
      query = applyRoleBasedFilter(query, user);

      // Apply filters
      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.sentiment) {
        query = query.eq("user_sentiment", input.sentiment);
      }

      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      const isAdminOrOwner =
        user.role === "admin" || user.role === "practice_owner";
      if (input.clinicName && isAdminOrOwner) {
        query = query.eq("clinic_name", input.clinicName);
      }

      if (input.assistantId) {
        query = query.eq("assistant_id", input.assistantId);
      }

      if (input.search) {
        query = query.or(
          `customer_phone.ilike.%${input.search}%,transcript.ilike.%${input.search}%`,
        );
      }

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data: calls, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch inbound calls: ${error.message}`,
        });
      }

      // Demo phone numbers that should only show one call (the longest duration one)
      const demoPhones = [
        "4084260512", // Eric Silva
        "4085612356", // Maria Serpa
      ];

      // Helper to normalize phone to last 10 digits
      const normalizePhone = (phone: string | null) =>
        (phone ?? "").replace(/\D/g, "").slice(-10);

      // Filter out specific hardcoded calls and deduplicate demo calls
      let filteredCalls = (calls ?? []).filter((call) => {
        // Hide Melissa's 5:39 AM call (phone: 4848455065)
        if (
          (call.customer_phone === "4848455065" ||
            call.customer_phone === "484-845-5065" ||
            call.customer_phone === "(484) 845-5065" ||
            call.customer_phone === "+1 (484) 845-5065" ||
            call.customer_phone === "+14848455065") &&
          call.created_at
        ) {
          const callTime = new Date(call.created_at);
          const hour = callTime.getUTCHours();
          const minute = callTime.getUTCMinutes();

          // Hide if it's the 5:39 AM call (13:39 UTC = 5:39 AM PST)
          if (hour === 13 && minute === 39) {
            return false;
          }
        }

        return true;
      });

      // Deduplicate demo phone calls - keep only the one with longest duration
      for (const demoPhone of demoPhones) {
        const demoCalls = filteredCalls.filter(
          (call) => normalizePhone(call.customer_phone) === demoPhone,
        );

        if (demoCalls.length > 1) {
          // Find the call with the longest duration
          const bestCall = demoCalls.reduce((best, current) => {
            const bestDuration = best.duration_seconds ?? 0;
            const currentDuration = current.duration_seconds ?? 0;
            return currentDuration > bestDuration ? current : best;
          });

          // Filter out all demo calls except the best one
          filteredCalls = filteredCalls.filter(
            (call) =>
              normalizePhone(call.customer_phone) !== demoPhone ||
              call.id === bestCall.id,
          );
        }
      }

      return {
        calls: filteredCalls,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: filteredCalls.length,
          totalPages: Math.ceil(filteredCalls.length / input.pageSize),
        },
      };
    }),

  /**
   * Get single inbound call with full details
   */
  getInboundCall: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's role and clinic
      const user = await getUserWithClinic(supabase, ctx.user.id);

      const { data: call, error } = await supabase
        .from("inbound_vapi_calls")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      if (!call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      // Check access
      const isAdminOrOwner =
        user.role === "admin" || user.role === "practice_owner";

      if (
        !isAdminOrOwner &&
        call.clinic_name !== user.clinic_name &&
        call.user_id !== user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this call",
        });
      }

      return call;
    }),

  /**
   * Get inbound call by VAPI call ID
   * Used to fetch recording/transcript for appointments and messages
   */
  getInboundCallByVapiId: protectedProcedure
    .input(z.object({ vapiCallId: z.string() }))
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Verify user has access (will throw if not)
      await getUserWithClinic(supabase, ctx.user.id);

      const { data: call, error } = await supabase
        .from("inbound_vapi_calls")
        .select(
          "recording_url, stereo_recording_url, transcript, cleaned_transcript, transcript_messages, duration_seconds, summary",
        )
        .eq("vapi_call_id", input.vapiCallId)
        .single();

      if (error || !call) {
        // Return null instead of throwing - call may not exist yet
        return null;
      }

      return {
        recordingUrl: call.stereo_recording_url ?? call.recording_url,
        transcript: call.transcript,
        cleanedTranscript: call.cleaned_transcript,
        transcriptMessages: call.transcript_messages,
        durationSeconds: call.duration_seconds,
        summary: call.summary,
      };
    }),

  /**
   * Get inbound call statistics
   */
  getInboundCallStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        clinicName: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's role and clinic
      const user = await getUserWithClinic(supabase, ctx.user.id);

      // Build optimized query - only select fields needed for stats
      let query = supabase
        .from("inbound_vapi_calls")
        .select("status, user_sentiment, duration_seconds, cost, created_at");

      // Apply role-based filtering (prevents SQL injection)
      query = applyRoleBasedFilter(query, user);

      // Apply date filters
      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      const isAdminOrOwner =
        user.role === "admin" || user.role === "practice_owner";
      if (input.clinicName && isAdminOrOwner) {
        query = query.eq("clinic_name", input.clinicName);
      }

      const { data: calls, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch call statistics: ${error.message}`,
        });
      }

      const allCalls = calls ?? [];

      // Calculate statistics
      const totalCalls = allCalls.length;
      const completedCalls = allCalls.filter(
        (c) => c.status === "completed",
      ).length;
      const failedCalls = allCalls.filter((c) => c.status === "failed").length;
      const inProgressCalls = allCalls.filter(
        (c) => c.status === "in_progress" || c.status === "ringing",
      ).length;

      const totalDuration = allCalls.reduce(
        (sum, c) => sum + (c.duration_seconds ?? 0),
        0,
      );
      const avgDuration =
        completedCalls > 0 ? Math.round(totalDuration / completedCalls) : 0;

      const totalCost = allCalls.reduce(
        (sum, c) => sum + Number(c.cost ?? 0),
        0,
      );

      const sentimentCounts = {
        positive: allCalls.filter((c) => c.user_sentiment === "positive")
          .length,
        neutral: allCalls.filter((c) => c.user_sentiment === "neutral").length,
        negative: allCalls.filter((c) => c.user_sentiment === "negative")
          .length,
      };

      const statusDistribution = {
        queued: allCalls.filter((c) => c.status === "queued").length,
        ringing: allCalls.filter((c) => c.status === "ringing").length,
        in_progress: allCalls.filter((c) => c.status === "in_progress").length,
        completed: completedCalls,
        failed: failedCalls,
        cancelled: allCalls.filter((c) => c.status === "cancelled").length,
      };

      // Group calls by day for chart
      const callsByDay = new Map<string, number>();
      allCalls.forEach((call) => {
        if (call.created_at) {
          const date =
            new Date(call.created_at).toISOString().split("T")[0] ?? "";
          const currentCount = callsByDay.get(date) ?? 0;
          callsByDay.set(date, currentCount + 1);
        }
      });

      return {
        totalCalls,
        completedCalls,
        failedCalls,
        inProgressCalls,
        avgDuration,
        totalCost,
        sentimentCounts,
        statusDistribution,
        callsByDay: Array.from(callsByDay.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      };
    }),

  /**
   * Get clinic-wide inbound calls (for admins/practice owners)
   */
  getInboundCallsByClinic: protectedProcedure
    .input(
      z.object({
        clinicName: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(5).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's role and clinic
      const user = await getUserWithClinic(supabase, ctx.user.id);

      // Only admins and practice owners can use this
      const isAdminOrOwner =
        user.role === "admin" || user.role === "practice_owner";

      if (!isAdminOrOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and practice owners can view clinic-wide calls",
        });
      }

      // Build query - sort by created_at descending (most recent first)
      let query = supabase
        .from("inbound_vapi_calls")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Filter by clinic
      const clinicName = input.clinicName ?? user.clinic_name;
      if (clinicName) {
        query = query.eq("clinic_name", clinicName);
      }

      // Apply pagination
      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data: calls, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch clinic calls: ${error.message}`,
        });
      }

      return {
        calls: calls ?? [],
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: count ?? 0,
          totalPages: Math.ceil((count ?? 0) / input.pageSize),
        },
      };
    }),

  /**
   * Delete an inbound call
   */
  deleteInboundCall: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get current user's role and clinic
      const user = await getUserWithClinic(supabase, ctx.user.id);

      // First, verify the call exists and check access
      const { data: call, error: fetchError } = await supabase
        .from("inbound_vapi_calls")
        .select("id, clinic_name, user_id")
        .eq("id", input.id)
        .single();

      if (fetchError || !call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      // Check access
      const isAdminOrOwner =
        user.role === "admin" || user.role === "practice_owner";

      if (
        !isAdminOrOwner &&
        call.clinic_name !== user.clinic_name &&
        call.user_id !== user.id
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this call",
        });
      }

      // Delete the call
      const { error: deleteError } = await supabase
        .from("inbound_vapi_calls")
        .delete()
        .eq("id", input.id);

      if (deleteError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete call: ${deleteError.message}`,
        });
      }

      return {
        success: true,
      };
    }),

  /**
   * Translate transcript to English and generate summary
   */
  translateTranscript: protectedProcedure
    .input(z.object({ transcript: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const { translateTranscript } = await import("@odis-ai/ai");
        return await translateTranscript({ transcript: input.transcript });
      } catch (error) {
        console.error("[TRANSLATE_TRPC] Error translating transcript:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to translate transcript",
        });
      }
    }),

  /**
   * Clean up transcript by fixing transcription errors
   * Uses AI to correct misspellings, remove filler words, and fix proper nouns
   */
  cleanTranscript: protectedProcedure
    .input(
      z.object({
        transcript: z.string().min(1),
        clinicName: z.string().optional(),
        knowledgeBase: z
          .object({
            hospitalNames: z.array(z.string()).optional(),
            staffNames: z.array(z.string()).optional(),
            petNames: z.array(z.string()).optional(),
            customTerms: z.array(z.string()).optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { cleanTranscript } = await import("@odis-ai/ai");
        return await cleanTranscript({
          transcript: input.transcript,
          clinicName: input.clinicName,
          knowledgeBase: input.knowledgeBase,
        });
      } catch (error) {
        console.error(
          "[CLEAN_TRANSCRIPT_TRPC] Error cleaning transcript:",
          error,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to clean transcript",
        });
      }
    }),

  /**
   * Fetch call data directly from VAPI API
   * Used as fallback when database data is incomplete (e.g., missing recording_url)
   */
  fetchCallFromVAPI: protectedProcedure
    .input(
      z.object({
        vapiCallId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { getCall } = await import("@odis-ai/vapi");
        const callData = await getCall(input.vapiCallId);

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
        console.error("[FETCH_CALL_FROM_VAPI] Error fetching call data:", {
          callId: input.vapiCallId,
          error: error instanceof Error ? error.message : String(error),
        });

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
    .input(
      z.object({
        vapiCallId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const supabase = await createClient();

      // First, try to get from database (already synced via webhooks)
      const { data: dbCall, error: dbError } = await supabase
        .from("inbound_vapi_calls")
        .select(
          "id, vapi_call_id, recording_url, stereo_recording_url, transcript, summary, duration_seconds, status, started_at, ended_at, call_analysis",
        )
        .eq("vapi_call_id", input.vapiCallId)
        .single();

      if (!dbError && dbCall) {
        // Database has the call data
        const hasRecording = !!dbCall.recording_url;
        const hasTranscript = !!dbCall.transcript;

        console.log("[GET_CALL_FOR_APPOINTMENT] Found call in database", {
          vapiCallId: input.vapiCallId,
          hasRecording,
          hasTranscript,
          hasSummary: !!dbCall.summary,
        });

        // If we have recording and transcript, return from DB
        if (hasRecording && hasTranscript) {
          return {
            id: dbCall.vapi_call_id,
            source: "database" as const,
            status: dbCall.status,
            recordingUrl: dbCall.recording_url,
            stereoRecordingUrl: dbCall.stereo_recording_url,
            transcript: dbCall.transcript,
            summary: dbCall.summary,
            analysis: dbCall.call_analysis as Record<string, unknown> | null,
            startedAt: dbCall.started_at,
            endedAt: dbCall.ended_at,
            duration: dbCall.duration_seconds,
          };
        }

        // If missing recording or transcript, try VAPI API
        console.log(
          "[GET_CALL_FOR_APPOINTMENT] DB missing data, fetching from VAPI",
          {
            vapiCallId: input.vapiCallId,
            hasRecording,
            hasTranscript,
          },
        );
      }

      // Fallback: Fetch from VAPI API
      try {
        const { getCall } = await import("@odis-ai/vapi");
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

        // If we have partial data from DB, return that instead of throwing
        if (dbCall) {
          return {
            id: dbCall.vapi_call_id,
            source: "database" as const,
            status: dbCall.status,
            recordingUrl: dbCall.recording_url,
            stereoRecordingUrl: dbCall.stereo_recording_url,
            transcript: dbCall.transcript,
            summary: dbCall.summary,
            analysis: dbCall.call_analysis as Record<string, unknown> | null,
            startedAt: dbCall.started_at,
            endedAt: dbCall.ended_at,
            duration: dbCall.duration_seconds,
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
    .input(
      z.object({
        id: z.string().uuid(),
        forceUpdate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Get the existing call record
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

      // Verify access
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

      // Check if sync is needed
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

      // Fetch from VAPI API
      try {
        const { getCall } = await import("@odis-ai/vapi");
        const vapiCall = await getCall(existingCall.vapi_call_id);

        console.log("[SYNC_CALL_FROM_VAPI] Fetched call data from VAPI", {
          callId: existingCall.vapi_call_id,
          hasRecording: !!vapiCall.recordingUrl,
          hasTranscript: !!vapiCall.transcript,
          hasAnalysis: !!vapiCall.analysis,
        });

        // Build update data - only include fields that are missing or force update
        const updateData: Record<string, unknown> = {};
        const fieldsUpdated: string[] = [];

        // Recording URL
        if (
          vapiCall.recordingUrl &&
          (!existingCall.recording_url || input.forceUpdate)
        ) {
          updateData.recording_url = vapiCall.recordingUrl;
          fieldsUpdated.push("recording_url");
        }

        // Transcript
        if (
          vapiCall.transcript &&
          (!existingCall.transcript || input.forceUpdate)
        ) {
          updateData.transcript = vapiCall.transcript;
          fieldsUpdated.push("transcript");
        }

        // Messages
        if (
          vapiCall.messages &&
          (!existingCall.transcript_messages || input.forceUpdate)
        ) {
          updateData.transcript_messages = vapiCall.messages;
          fieldsUpdated.push("transcript_messages");
        }

        // Analysis
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

        // Duration
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

        // Costs
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

        // Update database
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
    .input(
      z.object({
        ids: z.array(z.string().uuid()).max(50),
        forceUpdate: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient();

      // Verify admin access for batch operations
      const { data: user } = await supabase
        .from("users")
        .select("role")
        .eq("id", ctx.user.id)
        .single();

      const isAdmin = user?.role === "admin" || user?.role === "practice_owner";
      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Batch sync requires admin access",
        });
      }

      // Get all calls
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

      const { getCall } = await import("@odis-ai/vapi");

      const results: Array<{
        id: string;
        status: "synced" | "skipped" | "failed";
        fieldsUpdated?: string[];
        error?: string;
      }> = [];

      // Process calls with rate limiting
      for (const call of calls) {
        if (!call.vapi_call_id) {
          results.push({
            id: call.id,
            status: "skipped",
            error: "No VAPI call ID",
          });
          continue;
        }

        // Check if sync needed
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

          // Rate limiting: small delay between API calls
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

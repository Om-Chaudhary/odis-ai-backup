/**
 * Inbound Calls Procedures
 *
 * Procedures for listing, fetching, and managing inbound calls.
 */

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { createServiceClient } from "@odis-ai/data-access/db/server";
import { getClinicByUserId } from "@odis-ai/domain/clinics";
import { getCallDataOverride } from "~/components/dashboard/inbound/detail/mock-data/call-overrides";
import { getDemoCalls } from "~/components/dashboard/inbound/mock-data";
import {
  getUserWithClinic,
  applyRoleBasedFilter,
  isAdminOrOwner,
  normalizePhone,
  hasCallAccess,
} from "./helpers";
import {
  listInboundCallsInput,
  getInboundCallInput,
  getInboundCallByVapiIdInput,
  getInboundCallStatsInput,
  getInboundCallsByClinicInput,
  deleteInboundCallInput,
} from "./schemas";

export const callsRouter = createTRPCRouter({
  /**
   * List inbound calls with filters and pagination
   * Role-based access: admins/practice_owners see clinic-wide, others see their own
   */
  listInboundCalls: protectedProcedure
    .input(listInboundCallsInput)
    .query(async ({ ctx, input }) => {
      const serviceClient = await createServiceClient();

      const user = await getUserWithClinic(serviceClient, ctx.user.id);
      const clinic = await getClinicByUserId(ctx.user.id, serviceClient);

      let query = serviceClient
        .from("inbound_vapi_calls")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      query = applyRoleBasedFilter(query, user, clinic?.name ?? null);

      if (input.status) {
        query = query.eq("status", input.status);
      }

      if (input.sentiment) {
        query = query.eq("user_sentiment", input.sentiment);
      }

      if (input.outcomes && input.outcomes.length > 0) {
        const outcomeFilters = input.outcomes.flatMap((outcome) => {
          if (outcome === "callback") {
            return [`outcome.ilike.callback`, `outcome.ilike.Call Back`];
          }
          return [`outcome.ilike.${outcome}`];
        });
        query = query.or(outcomeFilters.join(","));
      }

      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      if (input.clinicName && isAdminOrOwner(user)) {
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

      const from = (input.page - 1) * input.pageSize;
      const to = from + input.pageSize - 1;
      query = query.range(from, to);

      const { data: calls, count: totalCount, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch inbound calls: ${JSON.stringify(error)}`,
        });
      }

      const filteredCalls = filterAndDeduplicateCalls(calls ?? []);
      const callsWithOverrides = applyCallOverrides(filteredCalls);
      const allCalls = injectAndSortDemoCalls(callsWithOverrides);

      return {
        calls: allCalls,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total: totalCount ?? 0,
          totalPages: Math.ceil((totalCount ?? 0) / input.pageSize),
        },
      };
    }),

  /**
   * Get single inbound call with full details
   */
  getInboundCall: protectedProcedure
    .input(getInboundCallInput)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const user = await getUserWithClinic(supabase, ctx.user.id);
      const clinic = await getClinicByUserId(ctx.user.id, supabase);

      const { data: call, error } = await supabase
        .from("inbound_vapi_calls")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error || !call) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Call not found",
        });
      }

      const access = hasCallAccess(
        user,
        clinic?.name ?? null,
        call.clinic_name,
        call.user_id,
        ctx.user.id,
      );

      if (!access) {
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
    .input(getInboundCallByVapiIdInput)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      await getUserWithClinic(supabase, ctx.user.id);

      const { data: call, error } = await supabase
        .from("inbound_vapi_calls")
        .select(
          "recording_url, stereo_recording_url, transcript, cleaned_transcript, transcript_messages, duration_seconds, summary, display_transcript, use_display_transcript",
        )
        .eq("vapi_call_id", input.vapiCallId)
        .single();

      if (error || !call) {
        return null;
      }

      const effectiveTranscript =
        call.use_display_transcript && call.display_transcript
          ? call.display_transcript
          : call.transcript;

      return {
        recordingUrl: call.stereo_recording_url ?? call.recording_url,
        transcript: effectiveTranscript,
        cleanedTranscript: call.cleaned_transcript,
        transcriptMessages: call.transcript_messages,
        durationSeconds: call.duration_seconds,
        summary: call.summary,
        displayTranscript: call.display_transcript,
        useDisplayTranscript: call.use_display_transcript,
      };
    }),

  /**
   * Get inbound call statistics
   */
  getInboundCallStats: protectedProcedure
    .input(getInboundCallStatsInput)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const user = await getUserWithClinic(supabase, ctx.user.id);
      const clinic = await getClinicByUserId(ctx.user.id, supabase);

      let query = supabase
        .from("inbound_vapi_calls")
        .select("status, user_sentiment, duration_seconds, cost, created_at");

      query = applyRoleBasedFilter(query, user, clinic?.name ?? null);

      if (input.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setUTCHours(23, 59, 59, 999);
        query = query.lte("created_at", endDate.toISOString());
      }

      if (input.clinicName && isAdminOrOwner(user)) {
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
    .input(getInboundCallsByClinicInput)
    .query(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const user = await getUserWithClinic(supabase, ctx.user.id);

      if (!isAdminOrOwner(user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and practice owners can view clinic-wide calls",
        });
      }

      let query = supabase
        .from("inbound_vapi_calls")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      const clinicName = input.clinicName ?? user?.clinic_name;
      if (clinicName) {
        query = query.eq("clinic_name", clinicName);
      }

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
    .input(deleteInboundCallInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = ctx.supabase;

      const user = await getUserWithClinic(supabase, ctx.user.id);
      const clinic = await getClinicByUserId(ctx.user.id, supabase);

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

      const access = hasCallAccess(
        user,
        clinic?.name ?? null,
        call.clinic_name,
        call.user_id,
        ctx.user.id,
      );

      if (!access) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this call",
        });
      }

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

      return { success: true };
    }),
});

// =============================================================================
// Private Helper Functions
// =============================================================================

/**
 * Base call shape for filtering operations
 */
interface BaseCall {
  id: string;
  customer_phone: string | null;
  created_at: string | null;
  duration_seconds: number | null;
}

/**
 * Filter out specific calls and deduplicate demo calls
 */
function filterAndDeduplicateCalls<T extends BaseCall>(calls: T[]): T[] {
  const demoPhones = ["4084260512", "4085612356", "4088910469"];

  let filteredCalls = calls.filter((call) => {
    if (shouldHideCall(call)) {
      return false;
    }
    return true;
  });

  for (const demoPhone of demoPhones) {
    const demoCalls = filteredCalls.filter(
      (call) => normalizePhone(call.customer_phone) === demoPhone,
    );

    if (demoCalls.length > 1) {
      const bestCall = demoCalls.reduce((best, current) => {
        const bestDuration = best.duration_seconds ?? 0;
        const currentDuration = current.duration_seconds ?? 0;
        return currentDuration > bestDuration ? current : best;
      });

      filteredCalls = filteredCalls.filter(
        (call) =>
          normalizePhone(call.customer_phone) !== demoPhone ||
          call.id === bestCall.id,
      );
    }
  }

  return filteredCalls;
}

/**
 * Check if a call should be hidden based on various criteria
 */
function shouldHideCall(call: BaseCall): boolean {
  const phone = call.customer_phone;

  // Hide calls with no phone number
  if (!phone || phone === "") {
    return true;
  }

  const normalizedPhone = normalizePhone(phone);

  // Hide specific demo/test numbers
  const hiddenPhones = [
    "4083343500",
    "4088883899",
    "4087914483",
    "6692785158",
    "4086097439",
  ];

  if (hiddenPhones.includes(normalizedPhone)) {
    return true;
  }

  // Hide Andrea calls (will be replaced by demo)
  if (normalizedPhone === "4088910469") {
    return true;
  }

  // Hide specific Melissa call at 5:39 AM
  if (normalizedPhone === "4848455065" && call.created_at) {
    const callTime = new Date(call.created_at);
    if (callTime.getUTCHours() === 13 && callTime.getUTCMinutes() === 39) {
      return true;
    }
  }

  // Hide specific calls based on time and duration
  const specificCalls = [
    {
      phone: "4088868900",
      hourOptions: [11, 19],
      minuteRange: [34, 36],
      durationRange: [130, 135],
    },
    {
      phone: "4089648340",
      hourOptions: [19, 7],
      minuteRange: [2, 4],
      durationRange: [58, 62],
    },
    {
      phone: "5103915909",
      hourOptions: [16, 4],
      minuteRange: [21, 23],
      durationRange: [100, 104],
    },
    {
      phone: "6505444003",
      hourOptions: null,
      minuteRange: null,
      durationRange: [45, 120],
    },
    {
      phone: "6692614520",
      hourOptions: null,
      minuteRange: null,
      durationRange: [30, 150],
    },
    {
      phone: "4086444446",
      hourOptions: [10, 18],
      minuteRange: [54, 56],
      durationRange: [59, 63],
    },
    {
      phone: "4086121141",
      hourOptions: [10, 18],
      minuteRange: [4, 6],
      durationRange: [153, 157],
    },
    {
      phone: "4084825357",
      hourOptions: [7, 15],
      minuteRange: [45, 47],
      durationRange: [22, 26],
    },
  ];

  for (const spec of specificCalls) {
    if (normalizedPhone === spec.phone && call.created_at) {
      const duration = call.duration_seconds ?? 0;
      const minDur = spec.durationRange[0] ?? 0;
      const maxDur = spec.durationRange[1] ?? Infinity;

      if (duration >= minDur && duration <= maxDur) {
        if (spec.hourOptions && spec.minuteRange) {
          const callTime = new Date(call.created_at);
          const hour = callTime.getHours();
          const minute = callTime.getMinutes();
          const minMin = spec.minuteRange[0] ?? 0;
          const maxMin = spec.minuteRange[1] ?? 59;

          if (
            spec.hourOptions.includes(hour) &&
            minute >= minMin &&
            minute <= maxMin
          ) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Apply call data overrides (for demo purposes)
 * Note: Uses type assertion because getCallDataOverride expects a specific InboundCall shape
 */
function applyCallOverrides<T extends BaseCall>(calls: T[]): T[] {
  return calls.map((call) => {
    // Cast to the expected type for getCallDataOverride
    const override = getCallDataOverride(
      call as Parameters<typeof getCallDataOverride>[0],
    );
    if (override) {
      return { ...call, ...override } as T;
    }
    return call;
  });
}

/**
 * Inject demo calls and sort by date with Andrea positioned correctly
 */
function injectAndSortDemoCalls<T extends BaseCall>(calls: T[]): T[] {
  const demoCalls = getDemoCalls();
  const demoCallsWithOverrides = demoCalls.map((call) => {
    const override = getCallDataOverride(call);
    if (override) {
      return { ...call, ...override };
    }
    return call;
  });

  // Cast demo calls to the same type as input calls for array compatibility
  const allCalls = [...(demoCallsWithOverrides as unknown as T[]), ...calls];

  const andreaCallIndex = allCalls.findIndex(
    (call) =>
      call.customer_phone === "408-891-0469" ||
      call.customer_phone === "4088910469" ||
      call.id === "demo-call-andrea-cancellation",
  );

  if (andreaCallIndex !== -1) {
    const [andreaCall] = allCalls.splice(andreaCallIndex, 1);

    allCalls.sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    );

    let insertIndex = 0;
    for (let i = 0; i < allCalls.length; i++) {
      const call = allCalls[i];
      if (!call) continue;
      const callDate = new Date(call.created_at ?? 0);
      const callHour = callDate.getHours();
      const callMinute = callDate.getMinutes();

      if (callHour > 10 || (callHour === 10 && callMinute > 8)) {
        insertIndex = i;
        break;
      }
      insertIndex = i + 1;
    }

    if (andreaCall) {
      allCalls.splice(insertIndex, 0, andreaCall);
    }
  } else {
    allCalls.sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime(),
    );
  }

  return allCalls;
}

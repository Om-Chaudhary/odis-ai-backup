/**
 * Custom hook for fetching inbound data (calls and stats)
 * Unified table view - no more separate appointments tab
 */

import { useRef, useEffect, useMemo } from "react";
import { api } from "~/trpc/client";
import type { CallStatusFilter, OutcomeFilter } from "../types";
import type { Database } from "@odis-ai/shared/types";
import { useClinic } from "@odis-ai/shared/ui/clinic-context";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface UseInboundDataParams {
  page: number;
  pageSize: number;
  callStatus: CallStatusFilter;
  outcomeFilter: OutcomeFilter;
  searchTerm: string;
}

/**
 * Hook for managing inbound data queries
 * Unified table view - fetches all calls with optional outcome filtering
 */
export function useInboundData(params: UseInboundDataParams) {
  const { page, pageSize, callStatus, outcomeFilter, searchTerm } = params;

  // Get clinic context for filtering
  const { clinicId } = useClinic();

  // Refs for polling stability
  const callsRef = useRef<InboundCall[]>([]);

  // Map filter to API status
  const getCallApiStatus = (filter: CallStatusFilter): string | undefined => {
    if (filter === "all") return undefined;
    return filter;
  };

  // Map outcome filter to actual outcome values
  const getOutcomesForFilter = (
    filter: OutcomeFilter,
  ):
    | Array<
        | "scheduled"
        | "rescheduled"
        | "cancellation"
        | "emergency"
        | "callback"
        | "info"
      >
    | undefined => {
    if (filter === "all") return undefined;
    // "appointment" maps to all appointment-related outcomes
    if (filter === "appointment")
      return ["scheduled", "rescheduled", "cancellation"];
    // Return single outcome value as array
    return [filter];
  };

  // Fetch calls with optional outcome filtering
  const {
    data: callsData,
    isLoading: callsLoading,
    refetch: refetchCalls,
  } = api.inboundCalls.listInboundCalls.useQuery(
    {
      page,
      pageSize,
      status: getCallApiStatus(callStatus) as
        | "queued"
        | "ringing"
        | "in_progress"
        | "completed"
        | "failed"
        | "cancelled"
        | undefined,
      search: searchTerm || undefined,
      outcomes: getOutcomesForFilter(outcomeFilter),
    },
    {
      refetchInterval: () => {
        const hasActive = callsRef.current.some(
          (c) =>
            c.status === "ringing" ||
            c.status === "in_progress" ||
            c.status === "queued",
        );
        return hasActive ? 5000 : 30000;
      },
    },
  );

  // Fetch stats filtered by current clinic
  const { data: statsData } = api.inbound.getInboundStats.useQuery({
    clinicId,
  });

  // Update refs when data changes
  useEffect(() => {
    if (callsData?.calls) {
      callsRef.current = callsData.calls;
    }
  }, [callsData?.calls]);

  // Derived data with custom Andrea placement for calls
  const calls = useMemo(() => {
    const rawCalls = callsData?.calls ?? [];

    // Find Andrea call for custom placement between Adriana and Sylvia
    const andreaCallIndex = rawCalls.findIndex(
      (call) =>
        call.customer_phone === "4088910469" ||
        call.customer_phone === "408-891-0469" ||
        call.customer_phone === "(408) 891-0469",
    );

    // Remove Andrea for custom placement
    let andreaCall = null;
    const remainingCalls = [...rawCalls];
    if (andreaCallIndex !== -1) {
      const removedAndrea = remainingCalls.splice(andreaCallIndex, 1);
      andreaCall = removedAndrea[0];
    }

    // Insert Andrea between Adriana Skandarian and Sylvia Rosella
    const finalCalls = [];
    let andreaInserted = false;

    for (const call of remainingCalls) {
      // Skip if call is undefined/null
      if (!call) continue;

      // Add current call
      finalCalls.push(call);

      // If this is Adriana Skandarian and we haven't inserted Andrea yet, insert Andrea next
      if (
        andreaCall &&
        !andreaInserted &&
        (call.customer_phone === "4087619777" ||
          call.customer_phone === "408-761-9777" ||
          call.customer_phone === "(408) 761-9777")
      ) {
        finalCalls.push(andreaCall);
        andreaInserted = true;
      }
    }

    // If Andrea wasn't inserted, add her at the end
    if (andreaCall && !andreaInserted) {
      finalCalls.push(andreaCall);
    }

    return finalCalls;
  }, [callsData?.calls]);

  // Pagination data
  const pagination = useMemo(() => {
    return callsData?.pagination ?? { page: 1, pageSize: 25, total: 0 };
  }, [callsData?.pagination]);

  // Stats for display
  const stats = useMemo(() => {
    return (
      statsData ?? {
        appointments: {
          total: 0,
          pending: 0,
          confirmed: 0,
          rejected: 0,
          cancelled: 0,
        },
        calls: {
          total: 0,
          completed: 0,
          inProgress: 0,
          failed: 0,
          cancelled: 0,
          needsAttention: 0,
          scheduled: 0,
          rescheduled: 0,
          cancellation: 0,
          emergency: 0,
          callback: 0,
          info: 0,
          appointment: 0,
        },
        totals: { appointments: 0, calls: 0, needsAttention: 0 },
      }
    );
  }, [statsData]);

  return {
    calls,
    pagination,
    stats,
    isLoading: callsLoading,
    refetchCalls,
  };
}

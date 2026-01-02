/**
 * Custom hook for fetching inbound data (calls, appointments, stats)
 */

import { useRef, useEffect, useMemo } from "react";
import { api } from "~/trpc/client";
import type {
  ViewMode,
  CallStatusFilter,
  AppointmentStatusFilter,
  AppointmentRequest,
} from "../types";
import type { Database } from "@odis-ai/shared/types";
import { getDemoAppointments } from "../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface UseInboundDataParams {
  viewMode: ViewMode;
  page: number;
  pageSize: number;
  callStatus: CallStatusFilter;
  appointmentStatus: AppointmentStatusFilter;
  searchTerm: string;
}

/**
 * Hook for managing inbound data queries
 * Handles calls, appointments, and stats
 * Fetches all data with pagination only (no date filtering)
 */
export function useInboundData(params: UseInboundDataParams) {
  const {
    viewMode,
    page,
    pageSize,
    callStatus,
    appointmentStatus,
    searchTerm,
  } = params;

  // Refs for polling stability
  const callsRef = useRef<InboundCall[]>([]);
  const appointmentsRef = useRef<AppointmentRequest[]>([]);

  // Map filter to API status
  const getCallApiStatus = (filter: CallStatusFilter): string | undefined => {
    if (filter === "all") return undefined;
    return filter;
  };

  const getAppointmentApiStatus = (
    filter: AppointmentStatusFilter,
  ): string | undefined => {
    if (filter === "all") return undefined;
    return filter;
  };

  // Fetch calls (no date filtering - all calls with pagination)
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
    },
    {
      enabled: viewMode === "calls",
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

  // Fetch appointments (no date filtering - all appointments with pagination)
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    refetch: refetchAppointments,
  } = api.inbound.listAppointmentRequests.useQuery(
    {
      page,
      pageSize,
      status: getAppointmentApiStatus(appointmentStatus) as
        | "pending"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | undefined,
      search: searchTerm || undefined,
    },
    {
      enabled: viewMode === "appointments",
      refetchInterval: 30000,
    },
  );

  // Fetch stats (global stats without date filtering)
  const { data: statsData } = api.inbound.getInboundStats.useQuery({});

  // Update refs when data changes
  useEffect(() => {
    if (callsData?.calls) {
      callsRef.current = callsData.calls;
    }
  }, [callsData?.calls]);

  useEffect(() => {
    if (appointmentsData?.appointments) {
      // Include demo appointments in ref for polling stability
      const demoAppointments = getDemoAppointments();
      appointmentsRef.current = [
        ...demoAppointments,
        ...appointmentsData.appointments,
      ];
    }
  }, [appointmentsData?.appointments]);

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

  // Merge real appointments with demo appointments and hardcode specific placements
  const appointments = useMemo(() => {
    const realAppointments = appointmentsData?.appointments ?? [];
    const demoAppointments = getDemoAppointments();

    // Combine all appointments
    const allAppointments = [...demoAppointments, ...realAppointments];

    // Find Andrea appointment for custom placement between Adriana and Sylvia
    const andreaAppointmentIndex = allAppointments.findIndex(
      (appointment) =>
        appointment.clientName === "Andrea Watkins" ||
        appointment.clientPhone === "408-891-0469" ||
        appointment.id === "demo-cancelled-appointment",
    );

    // Remove Andrea for custom placement
    let andreaAppointment = null;
    if (andreaAppointmentIndex !== -1) {
      const removedAndrea = allAppointments.splice(andreaAppointmentIndex, 1);
      andreaAppointment = removedAndrea[0];
    }

    // Sort remaining appointments by creation date (newest first)
    allAppointments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Insert Andrea between Adriana Skandarian and Sylvia Rosella
    const finalAppointments = [];
    let andreaInserted = false;

    for (const appointment of allAppointments) {
      // Skip if appointment is undefined/null
      if (!appointment) continue;

      // Add current appointment
      finalAppointments.push(appointment);

      // If this is Adriana Skandarian and we haven't inserted Andrea yet, insert Andrea next
      if (
        andreaAppointment &&
        !andreaInserted &&
        (appointment.clientName === "Adriana Skandarian" ||
          appointment.clientPhone === "408-761-9777" ||
          appointment.clientPhone === "(408) 761-9777")
      ) {
        finalAppointments.push(andreaAppointment);
        andreaInserted = true;
      }
    }

    // If Andrea wasn't inserted (e.g., Adriana not found), add her at the end
    if (andreaAppointment && !andreaInserted) {
      finalAppointments.push(andreaAppointment);
    }

    return finalAppointments;
  }, [appointmentsData?.appointments]);

  // Get current items based on view mode
  const currentItems = useMemo(() => {
    switch (viewMode) {
      case "calls":
        return calls;
      case "appointments":
        return appointments;
      default:
        return [];
    }
  }, [viewMode, calls, appointments]);

  const currentPagination = useMemo(() => {
    switch (viewMode) {
      case "calls":
        return callsData?.pagination ?? { page: 1, pageSize: 25, total: 0 };
      case "appointments":
        return (
          appointmentsData?.pagination ?? {
            page: 1,
            pageSize: 25,
            total: 0,
          }
        );
      default:
        return { page: 1, pageSize: 25, total: 0 };
    }
  }, [viewMode, callsData, appointmentsData]);

  const isLoading = useMemo(() => {
    switch (viewMode) {
      case "calls":
        return callsLoading;
      case "appointments":
        return appointmentsLoading;
      default:
        return false;
    }
  }, [viewMode, callsLoading, appointmentsLoading]);

  // Stats for filter tabs
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
        },
        totals: { appointments: 0, calls: 0, needsAttention: 0 },
      }
    );
  }, [statsData]);

  return {
    calls,
    appointments,
    currentItems,
    currentPagination,
    stats,
    isLoading,
    refetchCalls,
    refetchAppointments,
  };
}

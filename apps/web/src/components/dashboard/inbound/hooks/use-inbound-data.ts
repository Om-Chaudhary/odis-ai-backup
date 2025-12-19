/**
 * Custom hook for fetching inbound data (calls, appointments, messages, stats)
 */

import { useRef, useEffect, useMemo } from "react";
import { api } from "~/trpc/client";
import type {
  ViewMode,
  CallStatusFilter,
  AppointmentStatusFilter,
  MessageStatusFilter,
  AppointmentRequest,
  ClinicMessage,
} from "../types";
import type { Database } from "~/database.types";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface UseInboundDataParams {
  viewMode: ViewMode;
  page: number;
  pageSize: number;
  callStatus: CallStatusFilter;
  appointmentStatus: AppointmentStatusFilter;
  messageStatus: MessageStatusFilter;
  searchTerm: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook for managing inbound data queries
 * Handles calls, appointments, messages, and stats
 */
export function useInboundData(params: UseInboundDataParams) {
  const {
    viewMode,
    page,
    pageSize,
    callStatus,
    appointmentStatus,
    messageStatus,
    searchTerm,
    startDate,
    endDate,
  } = params;

  // Refs for polling stability
  const callsRef = useRef<InboundCall[]>([]);
  const appointmentsRef = useRef<AppointmentRequest[]>([]);
  const messagesRef = useRef<ClinicMessage[]>([]);

  // Map filter to API status
  const getCallApiStatus = (
    filter: CallStatusFilter,
  ): string | undefined => {
    if (filter === "all") return undefined;
    return filter;
  };

  const getAppointmentApiStatus = (
    filter: AppointmentStatusFilter,
  ): string | undefined => {
    if (filter === "all") return undefined;
    return filter;
  };

  const getMessageApiStatus = (
    filter: MessageStatusFilter,
  ): string | undefined => {
    if (filter === "all" || filter === "urgent") return undefined;
    return filter;
  };

  const getMessageApiPriority = (
    filter: MessageStatusFilter,
  ): string | undefined => {
    if (filter === "urgent") return "urgent";
    return undefined;
  };

  // Fetch calls
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
      startDate,
      endDate,
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

  // Fetch appointments
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
      startDate,
      endDate,
    },
    {
      enabled: viewMode === "appointments",
      refetchInterval: 30000,
    },
  );

  // Fetch messages
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = api.inbound.listClinicMessages.useQuery(
    {
      page,
      pageSize,
      status: getMessageApiStatus(messageStatus) as
        | "new"
        | "read"
        | "resolved"
        | undefined,
      priority: getMessageApiPriority(messageStatus) as
        | "urgent"
        | "normal"
        | undefined,
      search: searchTerm || undefined,
      startDate,
      endDate,
    },
    {
      enabled: viewMode === "messages",
      refetchInterval: 30000,
    },
  );

  // Fetch stats
  const { data: statsData } = api.inbound.getInboundStats.useQuery({
    startDate,
    endDate,
  });

  // Update refs when data changes
  useEffect(() => {
    if (callsData?.calls) {
      callsRef.current = callsData.calls;
    }
  }, [callsData?.calls]);

  useEffect(() => {
    if (appointmentsData?.appointments) {
      appointmentsRef.current = appointmentsData.appointments;
    }
  }, [appointmentsData?.appointments]);

  useEffect(() => {
    if (messagesData?.messages) {
      messagesRef.current = messagesData.messages;
    }
  }, [messagesData?.messages]);

  // Derived data
  const calls = useMemo(() => callsData?.calls ?? [], [callsData?.calls]);
  const appointments = useMemo(
    () => appointmentsData?.appointments ?? [],
    [appointmentsData?.appointments],
  );
  const messages = useMemo(
    () => messagesData?.messages ?? [],
    [messagesData?.messages],
  );

  // Get current items based on view mode
  const currentItems = useMemo(() => {
    switch (viewMode) {
      case "calls":
        return calls;
      case "appointments":
        return appointments;
      case "messages":
        return messages;
      default:
        return [];
    }
  }, [viewMode, calls, appointments, messages]);

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
      case "messages":
        return messagesData?.pagination ?? { page: 1, pageSize: 25, total: 0 };
      default:
        return { page: 1, pageSize: 25, total: 0 };
    }
  }, [viewMode, callsData, appointmentsData, messagesData]);

  const isLoading = useMemo(() => {
    switch (viewMode) {
      case "calls":
        return callsLoading;
      case "appointments":
        return appointmentsLoading;
      case "messages":
        return messagesLoading;
      default:
        return false;
    }
  }, [viewMode, callsLoading, appointmentsLoading, messagesLoading]);

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
        messages: { total: 0, new: 0, read: 0, resolved: 0, urgent: 0 },
        calls: {
          total: 0,
          completed: 0,
          inProgress: 0,
          failed: 0,
          cancelled: 0,
        },
        totals: { appointments: 0, messages: 0, calls: 0, needsAttention: 0 },
      }
    );
  }, [statsData]);

  return {
    calls,
    appointments,
    messages,
    currentItems,
    currentPagination,
    stats,
    isLoading,
    refetchCalls,
    refetchAppointments,
    refetchMessages,
  };
}

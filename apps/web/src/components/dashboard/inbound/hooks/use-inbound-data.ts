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
import type { Database } from "@odis-ai/shared/types";
import { getDemoAppointments } from "../demo-data";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

interface UseInboundDataParams {
  viewMode: ViewMode;
  page: number;
  pageSize: number;
  callStatus: CallStatusFilter;
  appointmentStatus: AppointmentStatusFilter;
  messageStatus: MessageStatusFilter;
  searchTerm: string;
}

/**
 * Hook for managing inbound data queries
 * Handles calls, appointments, messages, and stats
 * Fetches all data with pagination only (no date filtering)
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
  } = params;

  // Refs for polling stability
  const callsRef = useRef<InboundCall[]>([]);
  const appointmentsRef = useRef<AppointmentRequest[]>([]);
  const messagesRef = useRef<ClinicMessage[]>([]);

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

  // Fetch messages (no date filtering - all messages with pagination)
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
    },
    {
      enabled: viewMode === "messages",
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

  useEffect(() => {
    if (messagesData?.messages) {
      messagesRef.current = messagesData.messages;
    }
  }, [messagesData?.messages]);

  // Derived data
  const calls = useMemo(() => callsData?.calls ?? [], [callsData?.calls]);

  // Merge real appointments with demo appointments and hardcode specific placements
  const appointments = useMemo(() => {
    const realAppointments = appointmentsData?.appointments ?? [];
    const demoAppointments = getDemoAppointments();

    // Combine all appointments
    const allAppointments = [...demoAppointments, ...realAppointments];

    // Find special appointments for custom placement
    const specialAppointmentIndex334 = allAppointments.findIndex(
      (appointment) =>
        appointment.clientPhone === "(408) 334-3500" ||
        appointment.id === "demo-334-3500-appointment",
    );

    const andreaAppointmentIndex = allAppointments.findIndex(
      (appointment) =>
        appointment.clientName === "Andrea Watkins" ||
        appointment.clientPhone === "408-891-0469" ||
        appointment.id === "demo-cancelled-appointment",
    );

    // Remove special appointments for custom placement
    const specialAppointments = [];

    // Remove (408) 334-3500 appointment
    if (specialAppointmentIndex334 !== -1) {
      const removed334 = allAppointments.splice(specialAppointmentIndex334, 1);
      if (removed334[0]) {
        specialAppointments.push({ type: '334', appointment: removed334[0] });
      }
    }

    // Update Andrea index after potential removal of 334 appointment
    const updatedAndreaIndex = allAppointments.findIndex(
      (appointment) =>
        appointment.clientName === "Andrea Watkins" ||
        appointment.clientPhone === "408-891-0469" ||
        appointment.id === "demo-cancelled-appointment",
    );

    // Handle Andrea appointment if present
    if (updatedAndreaIndex !== -1) {
      const removedAndrea = allAppointments.splice(updatedAndreaIndex, 1);
      if (removedAndrea[0]) {
        specialAppointments.push({ type: 'andrea', appointment: removedAndrea[0] });
      }
    }

    // Sort remaining appointments by creation date (newest first)
    allAppointments.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Build final appointment list with special ordering:
    // 1. (408) 334-3500 at the top (Dec 26, 7:51 AM)
    // 2. Regular sorted appointments
    // 3. Andrea at her specific position (Dec 25, 10:08 AM)
    const finalAppointments = [];

    // Add (408) 334-3500 at the very top
    const appointment334 = specialAppointments.find(s => s.type === '334');
    if (appointment334) {
      finalAppointments.push(appointment334.appointment);
    }

    // Add remaining appointments, but insert Andrea in the right chronological position
    const andreaAppt = specialAppointments.find(s => s.type === 'andrea');
    let andreaInserted = false;

    for (let i = 0; i < allAppointments.length; i++) {
      const appointment = allAppointments[i];

      // If we have Andrea and haven't inserted her yet, check if this is the right position
      if (andreaAppt && !andreaInserted) {
        const appointmentDate = new Date(appointment.createdAt);
        const appointmentHour = appointmentDate.getHours();
        const appointmentMinute = appointmentDate.getMinutes();
        const appointmentDay = appointmentDate.getDate();

        // If this appointment is after Dec 25 10:08 AM, insert Andrea before it
        if (
          appointmentDay < 25 || // Before Dec 25
          (appointmentDay === 25 && (appointmentHour > 10 || (appointmentHour === 10 && appointmentMinute > 8)))
        ) {
          finalAppointments.push(andreaAppt.appointment);
          andreaInserted = true;
        }
      }

      finalAppointments.push(appointment);
    }

    // If Andrea wasn't inserted yet, add her at the end
    if (andreaAppt && !andreaInserted) {
      finalAppointments.push(andreaAppt.appointment);
    }

    return finalAppointments;
  }, [appointmentsData?.appointments]);

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

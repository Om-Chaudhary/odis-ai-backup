"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import { format, parseISO, startOfDay } from "date-fns";
import { api } from "~/trpc/client";

import type {
  ViewMode,
  AppointmentRequest,
  ClinicMessage,
  InboundStats,
  CallStatusFilter,
  AppointmentStatusFilter,
  MessageStatusFilter,
  InboundItem,
} from "./types";
import { PageToolbar, PageContent, PageFooter } from "../layout";
import { InboundFilterTabs } from "./inbound-filter-tabs";
import { InboundTable } from "./inbound-table";
import { InboundDetail } from "./inbound-detail";
import { InboundSplitLayout } from "./inbound-split-layout";
import { InboundPagination } from "./inbound-pagination";

// Database types for inbound calls
import type { Database } from "~/database.types";
type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Inbound Dashboard Client
 *
 * Features:
 * - View tabs: Calls / Appointments / Messages
 * - Status filters per view
 * - Full-screen split layout with pagination
 * - Compact table rows
 * - Detail panel for selected items
 */
export function InboundClient() {
  // URL-synced state
  const [dateStr, setDateStr] = useQueryState("date");

  const [viewMode, setViewMode] = useQueryState("view", {
    defaultValue: "appointments" as ViewMode,
    parse: (v) =>
      (["calls", "appointments", "messages"].includes(v)
        ? v
        : "appointments") as ViewMode,
  });

  const [callStatus, setCallStatus] = useQueryState("callStatus", {
    defaultValue: "all" as CallStatusFilter,
    parse: (v) =>
      (["all", "completed", "in_progress", "failed", "cancelled"].includes(v)
        ? v
        : "all") as CallStatusFilter,
  });

  const [appointmentStatus, setAppointmentStatus] = useQueryState(
    "appointmentStatus",
    {
      defaultValue: "all" as AppointmentStatusFilter,
      parse: (v) =>
        (["all", "pending", "confirmed", "rejected"].includes(v)
          ? v
          : "all") as AppointmentStatusFilter,
    },
  );

  const [messageStatus, setMessageStatus] = useQueryState("messageStatus", {
    defaultValue: "all" as MessageStatusFilter,
    parse: (v) =>
      (["all", "new", "read", "resolved", "urgent"].includes(v)
        ? v
        : "all") as MessageStatusFilter,
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize, setPageSize] = useQueryState(
    "size",
    parseAsInteger.withDefault(25),
  );

  // Parse current date (only used if date filter is applied)
  const currentDate = useMemo(() => {
    if (dateStr) {
      try {
        return parseISO(dateStr);
      } catch {
        return startOfDay(new Date());
      }
    }
    return startOfDay(new Date());
  }, [dateStr]);

  // Date range for API - only send if dateStr is present (otherwise show all)
  const { startDate, endDate } = useMemo(
    () => ({
      startDate: dateStr ?? undefined,
      endDate: dateStr ?? undefined,
    }),
    [dateStr],
  );

  // Local state
  const [selectedItem, setSelectedItem] = useState<InboundItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Refs for polling stability
  const callsRef = useRef<InboundCall[]>([]);
  const appointmentsRef = useRef<AppointmentRequest[]>([]);
  const messagesRef = useRef<ClinicMessage[]>([]);

  // Map filter to API status
  const getCallApiStatus = useCallback(
    (filter: CallStatusFilter): string | undefined => {
      if (filter === "all") return undefined;
      return filter;
    },
    [],
  );

  const getAppointmentApiStatus = useCallback(
    (filter: AppointmentStatusFilter): string | undefined => {
      if (filter === "all") return undefined;
      return filter;
    },
    [],
  );

  const getMessageApiStatus = useCallback(
    (filter: MessageStatusFilter): string | undefined => {
      if (filter === "all" || filter === "urgent") return undefined;
      return filter;
    },
    [],
  );

  const getMessageApiPriority = useCallback(
    (filter: MessageStatusFilter): string | undefined => {
      if (filter === "urgent") return "urgent";
      return undefined;
    },
    [],
  );

  // Fetch calls (existing router)
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

  // Mutations
  const updateAppointment = api.inbound.updateAppointmentRequest.useMutation({
    onSuccess: () => {
      toast.success("Appointment updated");
      setSelectedItem(null);
      void refetchAppointments();
    },
    onError: (error) => {
      toast.error("Failed to update appointment", {
        description: error.message,
      });
    },
  });

  const updateMessage = api.inbound.updateClinicMessage.useMutation({
    onSuccess: () => {
      toast.success("Message updated");
      setSelectedItem(null);
      void refetchMessages();
    },
    onError: (error) => {
      toast.error("Failed to update message", { description: error.message });
    },
  });

  const markRead = api.inbound.markMessageRead.useMutation({
    onSuccess: () => {
      toast.success("Marked as read");
      void refetchMessages();
    },
    onError: (error) => {
      toast.error("Failed to mark as read", { description: error.message });
    },
  });

  const deleteCall = api.inboundCalls.deleteInboundCall.useMutation({
    onSuccess: () => {
      toast.success("Call deleted");
      setSelectedItem(null);
      void refetchCalls();
    },
    onError: (error) => {
      toast.error("Failed to delete call", { description: error.message });
    },
  });

  const deleteAppointment = api.inbound.deleteAppointmentRequest.useMutation({
    onSuccess: () => {
      toast.success("Appointment deleted");
      setSelectedItem(null);
      void refetchAppointments();
    },
    onError: (error) => {
      toast.error("Failed to delete appointment", {
        description: error.message,
      });
    },
  });

  const deleteMessage = api.inbound.deleteClinicMessage.useMutation({
    onSuccess: () => {
      toast.success("Message deleted");
      setSelectedItem(null);
      void refetchMessages();
    },
    onError: (error) => {
      toast.error("Failed to delete message", { description: error.message });
    },
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

  // Escape to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedItem) {
        setSelectedItem(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedItem]);

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
  const stats: InboundStats = useMemo(() => {
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

  // Handlers
  const handleDateChange = useCallback(
    (newDate: Date | null) => {
      if (newDate === null) {
        void setDateStr(null);
      } else {
        void setDateStr(format(startOfDay(newDate), "yyyy-MM-dd"));
      }
      void setPage(1);
    },
    [setDateStr, setPage],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      void setViewMode(mode);
      setSelectedItem(null);
      void setPage(1);
    },
    [setViewMode, setPage],
  );

  const handleCallStatusChange = useCallback(
    (status: CallStatusFilter) => {
      void setCallStatus(status);
      setSelectedItem(null);
      void setPage(1);
    },
    [setCallStatus, setPage],
  );

  const handleAppointmentStatusChange = useCallback(
    (status: AppointmentStatusFilter) => {
      void setAppointmentStatus(status);
      setSelectedItem(null);
      void setPage(1);
    },
    [setAppointmentStatus, setPage],
  );

  const handleMessageStatusChange = useCallback(
    (status: MessageStatusFilter) => {
      void setMessageStatus(status);
      setSelectedItem(null);
      void setPage(1);
    },
    [setMessageStatus, setPage],
  );

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      void setPage(newPage);
      setSelectedItem(null);
    },
    [setPage],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      void setPageSize(newSize);
      void setPage(1);
      setSelectedItem(null);
    },
    [setPageSize, setPage],
  );

  const handleSelectItem = useCallback((item: InboundItem) => {
    setSelectedItem(item);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleKeyNavigation = useCallback(
    (direction: "up" | "down") => {
      if (currentItems.length === 0) return;

      const currentIndex = selectedItem
        ? currentItems.findIndex((c) => c.id === selectedItem.id)
        : -1;

      let newIndex: number;
      if (direction === "up") {
        newIndex =
          currentIndex <= 0 ? currentItems.length - 1 : currentIndex - 1;
      } else {
        newIndex =
          currentIndex >= currentItems.length - 1 ? 0 : currentIndex + 1;
      }

      const newItem = currentItems[newIndex];
      if (newItem) {
        handleSelectItem(newItem);
      }
    },
    [currentItems, selectedItem, handleSelectItem],
  );

  // Action handlers
  const handleConfirmAppointment = useCallback(
    async (id: string) => {
      await updateAppointment.mutateAsync({
        id,
        status: "confirmed",
      });
    },
    [updateAppointment],
  );

  const handleRejectAppointment = useCallback(
    async (id: string, notes?: string) => {
      await updateAppointment.mutateAsync({
        id,
        status: "rejected",
        notes,
      });
    },
    [updateAppointment],
  );

  const handleMarkMessageRead = useCallback(
    async (id: string) => {
      await markRead.mutateAsync({ id });
    },
    [markRead],
  );

  const handleResolveMessage = useCallback(
    async (id: string) => {
      await updateMessage.mutateAsync({
        id,
        status: "resolved",
      });
    },
    [updateMessage],
  );

  const handleDeleteCall = useCallback(
    async (id: string) => {
      await deleteCall.mutateAsync({ id });
    },
    [deleteCall],
  );

  const handleDeleteAppointment = useCallback(
    async (id: string) => {
      await deleteAppointment.mutateAsync({ id });
    },
    [deleteAppointment],
  );

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      await deleteMessage.mutateAsync({ id });
    },
    [deleteMessage],
  );

  const isSubmitting =
    updateAppointment.isPending ||
    updateMessage.isPending ||
    markRead.isPending ||
    deleteCall.isPending ||
    deleteAppointment.isPending ||
    deleteMessage.isPending;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-2">
      {/* Compact Toolbar - Date + View Tabs + Status Filters + Search */}
      <PageToolbar className="rounded-lg border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 py-2 shadow-md shadow-teal-500/5 backdrop-blur-md">
        <InboundFilterTabs
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          callStatus={callStatus}
          onCallStatusChange={handleCallStatusChange}
          appointmentStatus={appointmentStatus}
          onAppointmentStatusChange={handleAppointmentStatusChange}
          messageStatus={messageStatus}
          onMessageStatusChange={handleMessageStatusChange}
          stats={stats}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          isLoading={isLoading}
        />
      </PageToolbar>

      {/* Main Content Area */}
      <div className="min-h-0 flex-1">
        <InboundSplitLayout
          showRightPanel={selectedItem !== null}
          onCloseRightPanel={handleClosePanel}
          leftPanel={
            <>
              <PageContent>
                <InboundTable
                  items={currentItems}
                  viewMode={viewMode}
                  selectedItemId={selectedItem?.id ?? null}
                  onSelectItem={handleSelectItem}
                  onKeyNavigation={handleKeyNavigation}
                  isLoading={isLoading}
                  onQuickAction={
                    viewMode === "appointments"
                      ? handleConfirmAppointment
                      : viewMode === "messages"
                        ? handleMarkMessageRead
                        : undefined
                  }
                />
              </PageContent>
              <PageFooter>
                <InboundPagination
                  page={currentPagination.page}
                  pageSize={currentPagination.pageSize}
                  total={currentPagination.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </PageFooter>
            </>
          }
          rightPanel={
            <InboundDetail
              item={selectedItem}
              viewMode={viewMode}
              onConfirmAppointment={handleConfirmAppointment}
              onRejectAppointment={handleRejectAppointment}
              onMarkMessageRead={handleMarkMessageRead}
              onResolveMessage={handleResolveMessage}
              onDeleteCall={handleDeleteCall}
              onDeleteAppointment={handleDeleteAppointment}
              onDeleteMessage={handleDeleteMessage}
              isSubmitting={isSubmitting}
            />
          }
        />
      </div>
    </div>
  );
}

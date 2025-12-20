"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { format, parseISO, startOfDay } from "date-fns";

import type {
  ViewMode,
  CallStatusFilter,
  AppointmentStatusFilter,
  MessageStatusFilter,
  InboundItem,
} from "./types";
import { PageToolbar, PageContent, PageFooter } from "../layout";
import { InboundFilterTabs } from "./inbound-filter-tabs";
import { InboundTable } from "./table";
import { InboundDetail } from "./inbound-detail-refactored";
import { InboundSplitLayout } from "./inbound-split-layout";
import { InboundPagination } from "./inbound-pagination";
import { useInboundData, useInboundMutations } from "./hooks";

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

  // Use custom hooks for data and mutations
  const {
    currentItems,
    currentPagination,
    stats,
    isLoading,
    refetchCalls,
    refetchAppointments,
    refetchMessages,
  } = useInboundData({
    viewMode,
    page,
    pageSize,
    callStatus,
    appointmentStatus,
    messageStatus,
    searchTerm,
    startDate,
    endDate,
  });

  const {
    handleConfirmAppointment,
    handleRejectAppointment,
    handleMarkMessageRead,
    handleResolveMessage,
    handleDeleteCall,
    handleDeleteAppointment,
    handleDeleteMessage,
    isSubmitting,
  } = useInboundMutations({
    onAppointmentSuccess: () => {
      setSelectedItem(null);
      void refetchAppointments();
    },
    onMessageSuccess: () => {
      setSelectedItem(null);
      void refetchMessages();
    },
    onCallSuccess: () => {
      setSelectedItem(null);
      void refetchCalls();
    },
  });

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

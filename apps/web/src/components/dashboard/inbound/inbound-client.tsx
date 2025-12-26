"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { PhoneIncoming, Phone, Calendar, MessageSquare } from "lucide-react";

import type { ViewMode, InboundItem } from "./types";
import { PageContent, PageFooter } from "../layout";
import { DashboardPageHeader, DashboardToolbar } from "../shared";
import { InboundTable } from "./table";
import { InboundDetail } from "./inbound-detail-refactored";
import { InboundSplitLayout } from "./inbound-split-layout";
import { InboundPagination } from "./inbound-pagination";
import { useInboundData, useInboundMutations } from "./hooks";

/**
 * Inbound Dashboard Client
 *
 * Features:
 * - View mode controlled via URL query param (?view=calls|appointments|messages)
 * - View mode switching via inline pills in the toolbar
 * - Full-screen split layout with pagination
 * - Compact table rows
 * - Detail panel for selected items
 */
export function InboundClient() {
  // URL-synced state
  const [viewMode, setViewMode] = useQueryState("view", {
    defaultValue: "appointments" as ViewMode,
    parse: (v) =>
      (["calls", "appointments", "messages"].includes(v)
        ? v
        : "appointments") as ViewMode,
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize, setPageSize] = useQueryState(
    "size",
    parseAsInteger.withDefault(25),
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
    callStatus: "all",
    appointmentStatus: "all",
    messageStatus: "all",
    searchTerm,
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

  // Cmd+K for search
  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder="Search..."]',
        );
        searchInput?.focus();
      }
    };
    document.addEventListener("keydown", handleCmdK);
    return () => document.removeEventListener("keydown", handleCmdK);
  }, []);

  // Handle view mode change
  const handleViewChange = useCallback(
    (view: string) => {
      void setViewMode(view as ViewMode);
      void setPage(1);
      setSelectedItem(null);
    },
    [setViewMode, setPage],
  );

  // Handlers
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

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
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

  // Build view options with counts from stats
  const viewOptions = [
    { value: "calls", label: "Calls", icon: Phone, count: stats?.calls ?? 0 },
    {
      value: "appointments",
      label: "Appointments",
      icon: Calendar,
      count: stats?.appointments ?? 0,
    },
    {
      value: "messages",
      label: "Messages",
      icon: MessageSquare,
      count: stats?.messages ?? 0,
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Main Content Area - Full height split layout with header inside left panel */}
      <div className="min-h-0 flex-1">
        <InboundSplitLayout
          showRightPanel={selectedItem !== null}
          onCloseRightPanel={handleClosePanel}
          leftPanel={
            <>
              <DashboardPageHeader
                title="Inbound Communications"
                subtitle="Manage incoming calls, appointment requests, and messages"
                icon={PhoneIncoming}
              >
                <DashboardToolbar
                  viewOptions={viewOptions}
                  currentView={viewMode}
                  onViewChange={handleViewChange}
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder="Search..."
                  isLoading={isLoading}
                />
              </DashboardPageHeader>
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
                  isCompact={selectedItem !== null}
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

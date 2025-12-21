"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";

import type { ViewMode, InboundItem } from "./types";
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

  // Handlers
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      void setViewMode(mode);
      setSelectedItem(null);
      void setPage(1);
    },
    [setViewMode, setPage],
  );

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

  // Suppress unused variable warnings
  void searchTerm;
  void setSearchTerm;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-2">
      {/* Compact Toolbar - View Tabs */}
      <PageToolbar className="rounded-lg border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 py-2 shadow-md shadow-teal-500/5 backdrop-blur-md">
        <InboundFilterTabs
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          stats={stats}
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

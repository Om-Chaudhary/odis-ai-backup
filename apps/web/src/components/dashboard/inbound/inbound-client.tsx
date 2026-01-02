"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { PhoneIncoming, Phone, Calendar } from "lucide-react";

import type { ViewMode, InboundItem, CallActionFilter } from "./types";
import type { Database } from "@odis-ai/shared/types";
import { PageContent, PageFooter } from "../layout";
import { DashboardPageHeader, DashboardToolbar } from "../shared";
import { InboundTable } from "./table";
import { InboundDetail } from "./inbound-detail-refactored";
import { InboundSplitLayout } from "./inbound-split-layout";
import { InboundPagination } from "./inbound-pagination";
import { CallActionFilters } from "./call-action-filters";
import { useInboundData, useInboundMutations } from "./hooks";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Inbound Dashboard Client
 *
 * Features:
 * - View mode controlled via URL query param (?view=calls|appointments)
 * - View mode switching via inline pills in the toolbar
 * - Full-screen split layout with pagination
 * - Compact table rows
 * - Detail panel for selected items
 */
export function InboundClient() {
  // URL-synced state
  const [viewMode, setViewMode] = useQueryState("view", {
    defaultValue: "calls" as ViewMode,
    parse: (v) =>
      (["calls", "appointments"].includes(v) ? v : "calls") as ViewMode,
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize, setPageSize] = useQueryState(
    "size",
    parseAsInteger.withDefault(25),
  );

  // Local state
  const [selectedItem, setSelectedItem] = useState<InboundItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [callActionFilter, setCallActionFilter] =
    useState<CallActionFilter>("all");

  // Use custom hooks for data and mutations
  const {
    currentItems,
    currentPagination,
    stats,
    isLoading,
    refetchCalls,
    refetchAppointments,
  } = useInboundData({
    viewMode,
    page,
    pageSize,
    callStatus: "all",
    appointmentStatus: "all",
    searchTerm,
  });

  const {
    handleConfirmAppointment,
    handleRejectAppointment,
    handleDeleteCall,
    handleDeleteAppointment,
    isSubmitting,
  } = useInboundMutations({
    onAppointmentSuccess: () => {
      setSelectedItem(null);
      void refetchAppointments();
    },
    onCallSuccess: () => {
      setSelectedItem(null);
      void refetchCalls();
    },
  });

  // Apply call action filter when in calls view mode
  const filteredItems = useMemo(() => {
    if (viewMode !== "calls") {
      return currentItems;
    }

    // Filter calls based on call action filter
    return currentItems.filter((item) => {
      const call = item as InboundCall;
      const outcome = call.outcome;

      switch (callActionFilter) {
        case "needs_attention":
          return outcome === "Urgent" || outcome === "Call Back";
        case "urgent_only":
          return outcome === "Urgent";
        case "info_only":
          return outcome === "Info";
        case "all":
        default:
          return true;
      }
    });
  }, [currentItems, callActionFilter, viewMode]);

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
      if (filteredItems.length === 0) return;

      const currentIndex = selectedItem
        ? filteredItems.findIndex((c) => c.id === selectedItem.id)
        : -1;

      let newIndex: number;
      if (direction === "up") {
        newIndex =
          currentIndex <= 0 ? filteredItems.length - 1 : currentIndex - 1;
      } else {
        newIndex =
          currentIndex >= filteredItems.length - 1 ? 0 : currentIndex + 1;
      }

      const newItem = filteredItems[newIndex];
      if (newItem) {
        handleSelectItem(newItem);
      }
    },
    [filteredItems, selectedItem, handleSelectItem],
  );

  // Build view options with counts from stats
  const viewOptions = [
    {
      value: "calls",
      label: "Calls",
      icon: Phone,
      count: stats?.totals?.calls ?? 0,
    },
    {
      value: "appointments",
      label: "Appointments",
      icon: Calendar,
      count: stats?.totals?.appointments ?? 0,
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
                subtitle="Manage incoming calls and appointment requests"
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
              {/* Call action filters - only show for calls view */}
              {viewMode === "calls" && (
                <CallActionFilters
                  currentFilter={callActionFilter}
                  onFilterChange={setCallActionFilter}
                  isLoading={isLoading}
                />
              )}
              <PageContent>
                <InboundTable
                  items={filteredItems}
                  viewMode={viewMode}
                  selectedItemId={selectedItem?.id ?? null}
                  onSelectItem={handleSelectItem}
                  onKeyNavigation={handleKeyNavigation}
                  isLoading={isLoading}
                  onQuickAction={
                    viewMode === "appointments"
                      ? handleConfirmAppointment
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
              onDeleteCall={handleDeleteCall}
              onDeleteAppointment={handleDeleteAppointment}
              isSubmitting={isSubmitting}
            />
          }
        />
      </div>
    </div>
  );
}

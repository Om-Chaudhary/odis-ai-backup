"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Search } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

import type { ViewMode, InboundItem } from "./types";
import { PageToolbar, PageContent, PageFooter } from "../layout";
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
 * - View mode switching now in sidebar navigation
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

  // Suppress unused setViewMode (view mode now controlled by sidebar navigation)
  void setViewMode;

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

  // Suppress unused variable warnings
  void stats;

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Main Content Area - Full height split layout with toolbar inside left panel */}
      <div className="min-h-0 flex-1">
        <InboundSplitLayout
          showRightPanel={selectedItem !== null}
          onCloseRightPanel={handleClosePanel}
          leftPanel={
            <>
              <PageToolbar className="border-none bg-transparent px-4 pt-2 shadow-none backdrop-blur-none">
                <div className="flex items-center justify-end gap-6">
                  {/* Search */}
                  <div className="relative w-64">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className={cn(
                        "h-8 w-full rounded-md border border-teal-200/50 bg-white/60 pr-12 pl-9 text-sm",
                        "placeholder:text-slate-400",
                        "transition-all duration-200",
                        "hover:border-teal-300/60 hover:bg-white/80",
                        "focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:outline-none",
                      )}
                    />
                    <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-400 sm:inline-block">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </PageToolbar>
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

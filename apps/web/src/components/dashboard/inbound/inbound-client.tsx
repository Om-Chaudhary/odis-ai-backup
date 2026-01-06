"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { PhoneIncoming, Filter, ChevronDown } from "lucide-react";

import type { OutcomeFilter, OutcomeFilterCategory } from "./types";
import type { Database } from "@odis-ai/shared/types";
import { PageContent, PageFooter } from "../layout";
import { DashboardPageHeader, DashboardToolbar } from "../shared";
import { InboundTable } from "./table";
import { CallDetail } from "./detail/call-detail";
import { InboundSplitLayout } from "./inbound-split-layout";
import { InboundPagination } from "./inbound-pagination";
import { useInboundData, useInboundMutations } from "./hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odis-ai/shared/ui/popover";
import { Button } from "@odis-ai/shared/ui/button";
import { Checkbox } from "@odis-ai/shared/ui/checkbox";
import { cn } from "@odis-ai/shared/util";

type InboundCall = Database["public"]["Tables"]["inbound_vapi_calls"]["Row"];

/**
 * Inbound Dashboard Client
 *
 * Features:
 * - Unified table showing all inbound calls
 * - Outcome filter dropdown (All, Appointments, Urgent, etc.)
 * - Full-screen split layout with pagination
 * - Detail panel for selected calls
 */
export function InboundClient() {
  // URL-synced state
  const [outcomeFilter, setOutcomeFilter] = useQueryState("outcome", {
    defaultValue: "all" as OutcomeFilter,
    parse: (v) => {
      if (v === "all") return "all";
      // Parse comma-separated categories
      const categories = v
        .split(",")
        .filter((cat): cat is OutcomeFilterCategory =>
          ["emergency", "appointment", "callback", "info"].includes(cat),
        );
      return categories.length > 0 ? categories : "all";
    },
    serialize: (value) => {
      if (value === "all") return "all";
      return value.join(",");
    },
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize, setPageSize] = useQueryState(
    "size",
    parseAsInteger.withDefault(25),
  );

  // Local state
  const [selectedCall, setSelectedCall] = useState<InboundCall | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Use custom hooks for data and mutations
  const { calls, pagination, stats, isLoading, refetchCalls } = useInboundData({
    page,
    pageSize,
    callStatus: "all",
    outcomeFilter,
    searchTerm,
  });

  const { handleDeleteCall, isSubmitting } = useInboundMutations({
    onCallSuccess: () => {
      setSelectedCall(null);
      void refetchCalls();
    },
  });

  // Escape to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCall) {
        setSelectedCall(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedCall]);

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

  // Handle outcome filter change
  const handleOutcomeFilterChange = useCallback(
    (category: OutcomeFilterCategory) => {
      void setOutcomeFilter((prev) => {
        if (prev === "all") {
          return [category];
        }
        const categories = prev.includes(category)
          ? prev.filter((c) => c !== category)
          : [...prev, category];
        return categories.length > 0 ? categories : "all";
      });
      void setPage(1);
      setSelectedCall(null);
    },
    [setOutcomeFilter, setPage],
  );

  const handleClearFilters = useCallback(() => {
    void setOutcomeFilter("all");
    void setPage(1);
    setSelectedCall(null);
  }, [setOutcomeFilter, setPage]);

  // Handlers
  const handlePageChange = useCallback(
    (newPage: number) => {
      void setPage(newPage);
      setSelectedCall(null);
    },
    [setPage],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      void setPageSize(newSize);
      void setPage(1);
      setSelectedCall(null);
    },
    [setPageSize, setPage],
  );

  const handleSelectCall = useCallback((call: InboundCall) => {
    setSelectedCall(call);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCall(null);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleKeyNavigation = useCallback(
    (direction: "up" | "down") => {
      if (calls.length === 0) return;

      const currentIndex = selectedCall
        ? calls.findIndex((c) => c.id === selectedCall.id)
        : -1;

      let newIndex: number;
      if (direction === "up") {
        newIndex = currentIndex <= 0 ? calls.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= calls.length - 1 ? 0 : currentIndex + 1;
      }

      const newCall = calls[newIndex];
      if (newCall) {
        handleSelectCall(newCall);
      }
    },
    [calls, selectedCall, handleSelectCall],
  );

  // Outcome filter options
  const outcomeFilterOptions: Array<{
    value: OutcomeFilterCategory;
    label: string;
  }> = [
    { value: "emergency", label: "Emergency" },
    { value: "appointment", label: "Appointments" },
    { value: "callback", label: "Callback" },
    { value: "info", label: "Info" },
  ];

  // Get selected count for display
  const selectedCount = outcomeFilter === "all" ? 0 : outcomeFilter.length;
  const filterLabel =
    selectedCount === 0
      ? "Filter by outcome"
      : selectedCount === 1
        ? (outcomeFilterOptions.find((opt) => outcomeFilter.includes(opt.value))
            ?.label ?? "1 selected")
        : `${selectedCount} selected`;

  return (
    <div className="flex h-full flex-col">
      {/* Main Content Area - Full height split layout with header inside left panel */}
      <div className="min-h-0 flex-1">
        <InboundSplitLayout
          showRightPanel={selectedCall !== null}
          onCloseRightPanel={handleClosePanel}
          leftPanel={
            <>
              <DashboardPageHeader
                title="Inbound Communications"
                subtitle={`${stats?.totals?.calls ?? 0} total calls`}
                icon={PhoneIncoming}
              >
                <DashboardToolbar
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  searchPlaceholder="Search..."
                  isLoading={isLoading}
                  leftContent={
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400" />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "h-8 w-[180px] justify-between border-teal-200/50 bg-white/60 text-sm font-normal",
                              selectedCount > 0 &&
                                "border-teal-400 bg-teal-50/50",
                            )}
                          >
                            <span className="truncate">{filterLabel}</span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                          <div className="flex flex-col">
                            <div className="border-b px-3 py-2">
                              <p className="text-sm font-medium">
                                Filter by Outcome
                              </p>
                            </div>
                            <div className="flex flex-col gap-0.5 p-2">
                              {outcomeFilterOptions.map((option) => {
                                const isSelected =
                                  outcomeFilter !== "all" &&
                                  outcomeFilter.includes(option.value);
                                return (
                                  <button
                                    key={option.value}
                                    onClick={() =>
                                      handleOutcomeFilterChange(option.value)
                                    }
                                    className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      className="h-4 w-4"
                                    />
                                    <span>{option.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {selectedCount > 0 && (
                              <div className="border-t p-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleClearFilters}
                                  className="h-7 w-full text-xs"
                                >
                                  Clear filters
                                </Button>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  }
                />
              </DashboardPageHeader>
              <PageContent>
                <InboundTable
                  items={calls}
                  selectedItemId={selectedCall?.id ?? null}
                  onSelectItem={handleSelectCall}
                  onKeyNavigation={handleKeyNavigation}
                  isLoading={isLoading}
                  isCompact={selectedCall !== null}
                />
              </PageContent>
              <PageFooter>
                <InboundPagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </PageFooter>
            </>
          }
          rightPanel={
            selectedCall && (
              <CallDetail
                call={selectedCall}
                onDelete={handleDeleteCall}
                isSubmitting={isSubmitting}
              />
            )
          }
        />
      </div>
    </div>
  );
}

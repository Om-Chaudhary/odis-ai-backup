"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { PhoneIncoming, Filter } from "lucide-react";

import type { OutcomeFilter } from "./types";
import type { Database } from "@odis-ai/shared/types";
import { PageContent, PageFooter } from "../layout";
import { DashboardPageHeader, DashboardToolbar } from "../shared";
import { InboundTable } from "./table";
import { CallDetail } from "./detail/call-detail";
import { InboundSplitLayout } from "./inbound-split-layout";
import { InboundPagination } from "./inbound-pagination";
import { useInboundData, useInboundMutations } from "./hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@odis-ai/shared/ui/select";

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
    parse: (v) =>
      ([
        "all",
        "Scheduled",
        "Urgent",
        "Call Back",
        "Info",
        "Cancellation",
      ].includes(v)
        ? v
        : "all") as OutcomeFilter,
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
    (filter: string) => {
      void setOutcomeFilter(filter as OutcomeFilter);
      void setPage(1);
      setSelectedCall(null);
    },
    [setOutcomeFilter, setPage],
  );

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
  const outcomeFilterOptions = [
    { value: "all", label: "All Calls" },
    { value: "Scheduled", label: "Appointments" },
    { value: "Urgent", label: "Urgent" },
    { value: "Call Back", label: "Call Back" },
    { value: "Info", label: "Info" },
    { value: "Cancellation", label: "Cancellation" },
  ];

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
                      <Select
                        value={outcomeFilter}
                        onValueChange={handleOutcomeFilterChange}
                      >
                        <SelectTrigger className="h-8 w-[160px] border-teal-200/50 bg-white/60 text-sm">
                          <SelectValue placeholder="Filter by outcome" />
                        </SelectTrigger>
                        <SelectContent>
                          {outcomeFilterOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

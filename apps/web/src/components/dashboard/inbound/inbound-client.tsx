"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Download } from "lucide-react";

import type { OutcomeFilter, OutcomeFilterCategory } from "./types";
import type { Database } from "@odis-ai/shared/types";
import { PageContent, PageFooter } from "../layout";
import { InboundTable } from "./table";
import { CallDetail } from "./detail/call-detail";
import {
  DashboardSplitLayout,
  type SelectedRowPosition,
} from "../shared/layouts";
import { BulkActionBar, type BulkAction } from "../shared/bulk-action-bar";
import { useInboundData, useInboundMutations } from "./hooks";
import { useClinicSchedule } from "./hooks/use-clinic-schedule";
import { DataTablePagination } from "../shared/data-table";
import { useToast } from "~/hooks/use-toast";
import { useClinic } from "@odis-ai/shared/ui/clinic-context";

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
  // Get clinic context for schedule data
  const { clinicId } = useClinic();
  const { getStatus: getBusinessHoursStatus } = useClinicSchedule({ clinicId });

  // URL-synced state
  const [outcomeFilter] = useQueryState("outcome", {
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
  const [selectedRowPosition, setSelectedRowPosition] =
    useState<SelectedRowPosition | null>(null);

  // Bulk selection state
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(
    new Set(),
  );

  const { toast } = useToast();

  // Get search term from URL
  const [searchQuery] = useQueryState("search", { defaultValue: "" });
  const searchTerm = searchQuery ?? "";

  // Use custom hooks for data and mutations
  const { calls, pagination, isLoading, refetchCalls } = useInboundData({
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

  // Toggle handler: clicking same row closes panel
  const handleToggleCall = useCallback(
    (call: InboundCall) => {
      if (selectedCall?.id === call.id) {
        setSelectedCall(null);
        setSelectedRowPosition(null);
      }
    },
    [selectedCall?.id],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedCall(null);
    setSelectedRowPosition(null);
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

  // Bulk selection handlers
  const handleToggleBulkSelect = useCallback((callId: string) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(callId)) {
        next.delete(callId);
      } else {
        next.add(callId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedForBulk.size === calls.length) {
      setSelectedForBulk(new Set());
    } else {
      setSelectedForBulk(new Set(calls.map((c) => c.id)));
    }
  }, [calls, selectedForBulk.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedForBulk(new Set());
  }, []);

  // Bulk action handlers
  const handleExportSelected = useCallback(() => {
    // Get selected calls
    const selectedCalls = calls.filter((c) => selectedForBulk.has(c.id));

    // Create CSV content
    const headers = ["Date", "Time", "Phone", "Outcome", "Duration (s)"];
    const rows = selectedCalls.map((call) => {
      const date = call.created_at
        ? new Date(call.created_at).toLocaleDateString()
        : "";
      const time = call.created_at
        ? new Date(call.created_at).toLocaleTimeString()
        : "";
      return [
        date,
        time,
        call.customer_phone ?? "",
        call.outcome_category ?? "",
        call.duration_seconds != null ? String(call.duration_seconds) : "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inbound-calls-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${selectedCalls.length} calls to CSV`,
    });
  }, [calls, selectedForBulk, toast]);

  // Bulk actions config
  const bulkActions: BulkAction[] = [
    {
      id: "export",
      label: "Export Selected",
      icon: Download,
      onClick: handleExportSelected,
      variant: "outline",
    },
  ];

  return (
    <div id="inbound-page-container" className="flex h-full flex-col">
      <DashboardSplitLayout
        showRightPanel={selectedCall !== null}
        onCloseRightPanel={handleClosePanel}
        selectedRowPosition={selectedRowPosition}
        leftPanel={
          <>
            <PageContent>
              <InboundTable
                items={calls}
                selectedItemId={selectedCall?.id ?? null}
                onSelectItem={handleSelectCall}
                onToggleItem={handleToggleCall}
                onKeyNavigation={handleKeyNavigation}
                isLoading={isLoading}
                isCompact={selectedCall !== null}
                onSelectedRowPositionChange={setSelectedRowPosition}
                selectedForBulk={selectedForBulk}
                onToggleBulkSelect={handleToggleBulkSelect}
                onSelectAll={handleSelectAll}
                getBusinessHoursStatus={getBusinessHoursStatus}
              />
            </PageContent>
            <PageFooter fullWidth>
              <DataTablePagination
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

      {/* Bulk Action Bar - appears when calls are selected */}
      <BulkActionBar
        selectedCount={selectedForBulk.size}
        onClearSelection={handleClearSelection}
        actions={bulkActions}
        itemLabel="call"
        itemLabelPlural="calls"
      />
    </div>
  );
}

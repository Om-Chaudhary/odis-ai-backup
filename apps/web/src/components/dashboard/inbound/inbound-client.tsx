"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";

import type { OutcomeFilter, OutcomeFilterValue } from "./types";
import type { Database } from "@odis-ai/shared/types";
import { PageContent, PageFooter, PageToolbar } from "../layout";
import { InboundTable, OutcomeFilterPills } from "./table";
import { CallDetail } from "./detail/call-detail";
import {
  DashboardSplitLayout,
  type SelectedRowPosition,
} from "../shared/layouts";
import { useInboundData, useInboundMutations } from "./hooks";
import { useClinicSchedule } from "./hooks/use-clinic-schedule";
import { DataTablePagination } from "../shared/data-table";
import { useClinic } from "@odis-ai/shared/ui/clinic-context";
import { api } from "~/trpc/client";

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
  const [outcomeFilter, setOutcomeFilter] = useQueryState("outcome", {
    defaultValue: "all" as OutcomeFilter,
    parse: (v) => {
      if (v === "all") return "all";
      // Parse single outcome value
      const validOutcomes: OutcomeFilterValue[] = [
        "appointment",
        "emergency",
        "callback",
        "info",
      ];
      return validOutcomes.includes(v as OutcomeFilterValue)
        ? (v as OutcomeFilterValue)
        : "all";
    },
    serialize: (value) => value,
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize] = useQueryState("size", parseAsInteger.withDefault(25));

  // Deep link support: Direct call ID (for extension integration)
  const [callId, setCallId] = useQueryState("callId", parseAsString);

  // Local state
  const [selectedCall, setSelectedCall] = useState<InboundCall | null>(null);
  const [selectedRowPosition, setSelectedRowPosition] =
    useState<SelectedRowPosition | null>(null);

  // Get search term from URL
  const [searchQuery] = useQueryState("search", { defaultValue: "" });
  const searchTerm = searchQuery ?? "";

  // Use custom hooks for data and mutations
  const { calls, pagination, stats, isLoading, refetchCalls } = useInboundData({
    page,
    pageSize,
    callStatus: "all",
    outcomeFilter,
    searchTerm,
  });

  // Deep link: Fetch call by ID when callId param is present
  const { data: callByIdData, isLoading: isCallByIdLoading } =
    api.inbound.getCallById.useQuery(
      { callId: callId ?? "00000000-0000-0000-0000-000000000000" },
      { enabled: !!callId },
    );

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

  const handleSelectCall = useCallback(
    (call: InboundCall) => {
      setSelectedCall(call);
      // Update URL for deep linking / shareable URLs
      void setCallId(call.id);
    },
    [setCallId],
  );

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
    // Clear URL param when closing panel
    void setCallId(null);
  }, [setCallId]);

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

  // Deep link handling: Auto-select call when callId param is present
  const callIdDeepLinkHandledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!callId || isCallByIdLoading || isLoading) return;
    if (callIdDeepLinkHandledRef.current === callId) return;

    // First, check if call exists in current list
    const existingCall = calls.find((c) => c.id === callId);
    if (existingCall) {
      callIdDeepLinkHandledRef.current = callId;
      handleSelectCall(existingCall);
      toast.success("Call opened");
      void setCallId(null);
      return;
    }

    // Call not in current list - check if it exists via API
    if (callByIdData) {
      callIdDeepLinkHandledRef.current = callId;
      // Call exists but not in current filtered view
      handleSelectCall(callByIdData);
      toast.success("Call opened", {
        description: "Call was loaded from another view",
      });
      void setCallId(null);
    } else if (!isCallByIdLoading) {
      // API query complete but no data - call not found
      callIdDeepLinkHandledRef.current = callId;
      toast.error("Call not found", {
        description: `No call found for ID: ${callId}`,
      });
      void setCallId(null);
    }
  }, [
    callId,
    callByIdData,
    isCallByIdLoading,
    calls,
    isLoading,
    handleSelectCall,
    setCallId,
  ]);

  return (
    <div id="inbound-page-container" className="flex h-full flex-col">
      <DashboardSplitLayout
        showRightPanel={selectedCall !== null}
        onCloseRightPanel={handleClosePanel}
        selectedRowPosition={selectedRowPosition}
        leftPanel={
          <>
            <PageToolbar>
              <OutcomeFilterPills
                value={outcomeFilter}
                onChange={(value) => void setOutcomeFilter(value)}
                stats={stats.calls}
              />
            </PageToolbar>
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
                getBusinessHoursStatus={getBusinessHoursStatus}
              />
            </PageContent>
            <PageFooter fullWidth>
              <DataTablePagination
                page={pagination.page}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onPageChange={handlePageChange}
              />
            </PageFooter>
          </>
        }
        rightPanel={
          selectedCall && (
            <CallDetail
              key={selectedCall.id}
              call={selectedCall}
              onDelete={handleDeleteCall}
              isSubmitting={isSubmitting}
            />
          )
        }
      />
    </div>
  );
}

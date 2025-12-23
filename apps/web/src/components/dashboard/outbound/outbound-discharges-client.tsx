"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { format, parseISO, startOfDay } from "date-fns";
import { TestTube, Settings } from "lucide-react";
import Link from "next/link";

import type {
  DischargeCaseStatus,
  ViewMode,
  DeliveryToggles,
  SoapNote,
} from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import { PageContainer, PageToolbar, PageContent, PageFooter } from "../layout";
import { OutboundFilterTabs } from "./outbound-filter-tabs";
import { OutboundCaseTable } from "./outbound-case-table";
import { OutboundCaseDetail } from "./outbound-case-detail-refactored";
import { OutboundSplitLayout } from "./outbound-split-layout";
import { OutboundPagination } from "./outbound-pagination";
import { OutboundNeedsReviewTable } from "./outbound-needs-review-table";
import { OutboundNeedsAttentionTable } from "./outbound-needs-attention-table";
import { OutboundBulkActionBar } from "./outbound-bulk-action-bar";
import { Button } from "@odis-ai/ui/button";
import { useOutboundData, useOutboundMutations } from "./hooks";

// Type for transformed case from API
interface TransformedCase {
  id: string;
  caseId: string;
  patient: {
    id: string;
    name: string;
    species: string | null;
    breed: string | null;
    dateOfBirth: string | null;
    sex: string | null;
    weightKg: number | null;
  };
  owner: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  caseType: string | null;
  caseStatus: string | null;
  veterinarian: string;
  status: DischargeCaseStatus;
  phoneSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  emailSent: "sent" | "pending" | "failed" | "not_applicable" | null;
  dischargeSummary: string;
  structuredContent: StructuredDischargeSummary | null;
  callScript: unknown;
  emailContent: string;
  scheduledCall: {
    id: string;
    status: string;
    scheduledFor: string | null;
    startedAt: string | null;
    endedAt: string | null;
    durationSeconds: number | null;
    endedReason: string | null;
    transcript: string | null;
    summary: string | null;
    customerPhone: string | null;
    structuredData?: Record<string, unknown> | null;
    recordingUrl?: string | null;
    stereoRecordingUrl?: string | null;
  } | null;
  scheduledEmail: unknown;
  timestamp: string;
  createdAt: string;
  extremeCaseCheck: unknown;
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
  isStarred?: boolean;
  // Attention fields
  attentionTypes: string[] | null;
  attentionSeverity: string | null;
  attentionSummary: string | null;
  attentionFlaggedAt: string | null;
  needsAttention: boolean;
}

// Map status filter to API status (for non-failure filters)

/**
 * Outbound Discharge Manager - Full Screen Compact Layout
 *
 * Features:
 * - View tabs: All Discharges / Needs Review
 * - Status filters: All, Ready to Send, Scheduled, Sent, Failed
 * - Full-screen layout with pagination
 * - Compact table rows
 * - Inline editing for cases needing review
 * - Deep linking via consultationId query param (IDEXX Neo integration)
 */
export function OutboundDischargesClient() {
  // URL-synced state
  const [dateStr, setDateStr] = useQueryState("date", {
    defaultValue: format(startOfDay(new Date()), "yyyy-MM-dd"),
  });

  const [viewMode, setViewMode] = useQueryState("view", {
    defaultValue: "all" as ViewMode,
    parse: (v) =>
      (["all", "needs_review", "needs_attention"].includes(v)
        ? v
        : "all") as ViewMode,
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize, setPageSize] = useQueryState(
    "size",
    parseAsInteger.withDefault(25),
  );

  // Deep link support: IDEXX Neo consultation ID
  const [consultationId, setConsultationId] = useQueryState(
    "consultationId",
    parseAsString,
  );

  // Parse current date
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

  // Date range for API - send YYYY-MM-DD strings, backend handles timezone conversion
  const { startDate, endDate } = useMemo(
    () => ({
      // Send the same YYYY-MM-DD string for both start and end
      // The backend's getLocalDayRange() will convert to proper UTC boundaries
      startDate: dateStr ?? format(startOfDay(new Date()), "yyyy-MM-dd"),
      endDate: dateStr ?? format(startOfDay(new Date()), "yyyy-MM-dd"),
    }),
    [dateStr],
  );

  // Local state
  const [selectedCase, setSelectedCase] = useState<TransformedCase | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveryToggles, setDeliveryToggles] = useState<DeliveryToggles>({
    phoneEnabled: true,
    emailEnabled: true,
    immediateDelivery: false,
  });
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(
    new Set(),
  );

  // Track if we've handled the deep link to avoid re-processing
  const deepLinkHandledRef = useRef<string | null>(null);

  // Use custom hooks for data and mutations
  const {
    cases,
    totalCases,
    stats: statsData,
    settings: settingsData,
    deepLinkData,
    isDeepLinkLoading,
    isLoading,
    refetch,
    previousAttentionDate,
    previousAttentionCount,
    hasPreviousAttention,
  } = useOutboundData({
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    consultationId,
    viewMode: viewMode,
  });

  const {
    handleApproveAndSend: approveAndSendHandler,
    handleRetry: retryHandler,
    handleQuickSchedule,
    handleToggleStar,
    handleBulkSchedule,
    handleCancelScheduled: cancelScheduledHandler,
    handleBulkCancel,
    isSubmitting,
    isBulkScheduling,
    isBulkCancelling,
    schedulingCaseIds,
    togglingStarCaseIds,
    cancellingCaseIds,
  } = useOutboundMutations({
    onSuccess: () => {
      setSelectedCase(null);
      setSelectedForBulk(new Set());
      void refetch();
    },
  });

  // Wrapper handlers for use in component
  const handleApproveAndSend = useCallback(async () => {
    if (!selectedCase) return;
    await approveAndSendHandler(selectedCase.id, deliveryToggles);
  }, [selectedCase, deliveryToggles, approveAndSendHandler]);

  const handleRetry = useCallback(async () => {
    if (!selectedCase) return;
    await retryHandler(selectedCase.id, {
      retryCall: selectedCase.phoneSent === "failed",
      retryEmail: selectedCase.emailSent === "failed",
    });
  }, [selectedCase, retryHandler]);

  const handleCancelScheduled = useCallback(
    async (options: { cancelCall: boolean; cancelEmail: boolean }) => {
      if (!selectedCase) return;
      await cancelScheduledHandler(selectedCase.id, options);
    },
    [selectedCase, cancelScheduledHandler],
  );

  // Check if current case is being cancelled
  const isCancellingCurrentCase = selectedCase
    ? cancellingCaseIds.has(selectedCase.id)
    : false;

  // Escape to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCase) {
        setSelectedCase(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedCase]);

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

  // Deep link handling: Navigate to correct date and page when case is found
  useEffect(() => {
    // Skip if no consultation ID or already handled this one
    if (!consultationId || deepLinkHandledRef.current === consultationId) {
      return;
    }

    // Skip if still loading
    if (isDeepLinkLoading) {
      return;
    }

    if (deepLinkData?.found && deepLinkData.date) {
      // Mark as handled (date navigation)
      deepLinkHandledRef.current = consultationId;

      // Navigate to the case's date and correct page
      const caseDate = format(
        startOfDay(parseISO(deepLinkData.date)),
        "yyyy-MM-dd",
      );
      void setDateStr(caseDate);
      // Navigate to the page where the case is located (defaults to 1 if not provided)
      void setPage(deepLinkData.page ?? 1);
      // Don't clear consultationId yet - wait until case is selected (see below)
    } else if (deepLinkData && !deepLinkData.found) {
      // Mark as handled (not found case)
      deepLinkHandledRef.current = consultationId;
      toast.error("Case not found", {
        description: `No case found for consultation ID: ${consultationId}`,
      });
      void setConsultationId(null);
    }
  }, [
    consultationId,
    deepLinkData,
    isDeepLinkLoading,
    setDateStr,
    setPage,
    setConsultationId,
  ]);

  // Cases needing review (missing contact info)
  const needsReviewCases = useMemo(
    () =>
      (cases as TransformedCase[]).filter(
        (c) => !c.owner.phone || !c.owner.email,
      ),
    [cases],
  );

  // Cases needing attention (flagged by AI)
  // Sorted by severity: critical first, then urgent, then routine
  const needsAttentionCases = useMemo(() => {
    const filtered = (cases as TransformedCase[]).filter(
      (c) => c.needsAttention === true,
    );
    const severityOrder: Record<string, number> = {
      critical: 0,
      urgent: 1,
      routine: 2,
    };
    return [...filtered].sort((a, b) => {
      const aOrder = severityOrder[a.attentionSeverity ?? ""] ?? 3;
      const bOrder = severityOrder[b.attentionSeverity ?? ""] ?? 3;
      return aOrder - bOrder;
    });
  }, [cases]);

  // Suppress unused statsData (counts were displayed in filter tabs, now in sidebar)
  void statsData;

  // Handlers
  const handleDateChange = useCallback(
    (newDate: Date) => {
      void setDateStr(format(startOfDay(newDate), "yyyy-MM-dd"));
      void setPage(1);
    },
    [setDateStr, setPage],
  );

  // Handler for navigating to previous attention date
  const handleGoToPreviousAttention = useCallback(() => {
    if (previousAttentionDate) {
      void setDateStr(previousAttentionDate);
      void setPage(1);
    }
  }, [previousAttentionDate, setDateStr, setPage]);

  // Suppress unused setViewMode (view mode now controlled by sidebar navigation)
  void setViewMode;

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      void setPage(newPage);
      setSelectedCase(null);
    },
    [setPage],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      void setPageSize(newSize);
      void setPage(1);
      setSelectedCase(null);
    },
    [setPageSize, setPage],
  );

  const handleSelectCase = useCallback((caseItem: unknown) => {
    const typedCase = caseItem as TransformedCase;
    setSelectedCase(typedCase);
    setDeliveryToggles((prev) => ({
      phoneEnabled: !!typedCase.owner.phone,
      emailEnabled: !!typedCase.owner.email,
      immediateDelivery: prev.immediateDelivery ?? false, // Preserve the immediate delivery setting
    }));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCase(null);
  }, []);

  const handleKeyNavigation = useCallback(
    (direction: "up" | "down") => {
      const typedCases = cases as TransformedCase[];
      if (typedCases.length === 0) return;

      const currentIndex = selectedCase
        ? typedCases.findIndex((c) => c.id === selectedCase.id)
        : -1;

      let newIndex: number;
      if (direction === "up") {
        newIndex = currentIndex <= 0 ? typedCases.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= typedCases.length - 1 ? 0 : currentIndex + 1;
      }

      const newCase = typedCases[newIndex];
      if (newCase) {
        handleSelectCase(newCase);
      }
    },
    [cases, selectedCase, handleSelectCase],
  );

  // Deep link handling: Auto-select case once data loads
  // Track if we've auto-selected to avoid repeating
  const deepLinkSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    // Wait for cases to load after date navigation
    if (
      !deepLinkData?.found ||
      !deepLinkData.caseId ||
      isLoading ||
      cases.length === 0
    ) {
      return;
    }

    // Skip if we've already selected this case via deep link
    if (deepLinkSelectedRef.current === deepLinkData.caseId) {
      return;
    }

    // Find and select the case
    const targetCase = cases.find((c) => c.id === deepLinkData.caseId);
    if (targetCase) {
      deepLinkSelectedRef.current = deepLinkData.caseId;
      handleSelectCase(targetCase);
      toast.success("Case opened", {
        description: `${targetCase.patient.name} - ${targetCase.owner.name ?? "Unknown owner"}`,
      });
      // Clear the consultation ID from URL now that case is selected
      void setConsultationId(null);
    }
  }, [
    deepLinkData?.found,
    deepLinkData?.caseId,
    cases,
    isLoading,
    handleSelectCase,
    setConsultationId,
  ]);

  // Needs review handlers
  const handleUpdateContact = useCallback(
    async (_caseId: string, field: "phone" | "email", _value: string) => {
      // TODO: Implement API call to update contact
      toast.success(`Updated ${field} for case`);
      void refetch();
    },
    [refetch],
  );

  // Bulk selection handlers
  const handleToggleBulkSelect = useCallback((caseId: string) => {
    setSelectedForBulk((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const typedCases = cases as TransformedCase[];
    // Filter to only selectable cases (pending_review with contact info)
    const selectableCases = typedCases.filter(
      (c) =>
        c.status === "pending_review" &&
        (Boolean(c.owner.phone) || Boolean(c.owner.email)),
    );

    if (
      selectedForBulk.size === selectableCases.length &&
      selectableCases.length > 0
    ) {
      setSelectedForBulk(new Set());
    } else {
      setSelectedForBulk(new Set(selectableCases.map((c) => c.id)));
    }
  }, [cases, selectedForBulk.size]);

  const handleClearSelection = useCallback(() => {
    setSelectedForBulk(new Set());
  }, []);

  const handleScheduleSelected = useCallback(async () => {
    if (selectedForBulk.size === 0) {
      toast.error("No cases selected");
      return;
    }

    await handleBulkSchedule(Array.from(selectedForBulk));
  }, [selectedForBulk, handleBulkSchedule]);

  const handleCancelSelected = useCallback(async () => {
    if (selectedForBulk.size === 0) {
      toast.error("No cases selected");
      return;
    }

    await handleBulkCancel(Array.from(selectedForBulk));
  }, [selectedForBulk, handleBulkCancel]);

  // Determine if any selected cases are scheduled (to show cancel button)
  const hasScheduledCasesSelected = useMemo(() => {
    const typedCases = cases as TransformedCase[];
    return typedCases.some(
      (c) => selectedForBulk.has(c.id) && c.status === "scheduled",
    );
  }, [cases, selectedForBulk]);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col gap-2 overflow-hidden">
      {/* Test Mode Banner */}
      {settingsData?.testModeEnabled && (
        <div className="mx-auto w-full max-w-[1800px] px-4">
          <div className="flex items-center justify-between rounded-lg border-2 border-amber-500/50 bg-amber-50/80 px-4 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/20">
                <TestTube className="h-4 w-4 text-amber-700" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  Test Mode Active
                </h3>
                <p className="text-xs text-amber-700">
                  All calls/emails will be sent to:{" "}
                  <span className="font-medium">
                    {settingsData.testContactEmail ??
                      settingsData.testContactPhone ??
                      "test contact"}
                  </span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-amber-600/30 text-amber-800 hover:bg-amber-100/50"
            >
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area - Full height split layout with toolbar inside left panel */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {viewMode === "needs_review" ? (
          // Needs Review View
          <PageContainer className="h-full">
            <PageToolbar className="border-none bg-transparent shadow-none backdrop-blur-none">
              <OutboundFilterTabs
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                currentDate={currentDate}
                onDateChange={handleDateChange}
                isLoading={isLoading}
              />
            </PageToolbar>
            <PageContent>
              <OutboundNeedsReviewTable
                cases={needsReviewCases}
                isLoading={isLoading}
                onUpdateContact={handleUpdateContact}
              />
            </PageContent>
            <PageFooter>
              <OutboundPagination
                page={page}
                pageSize={pageSize}
                total={needsReviewCases.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </PageFooter>
          </PageContainer>
        ) : viewMode === "needs_attention" ? (
          // Needs Attention View - Cases flagged by AI, sorted by severity
          <OutboundSplitLayout
            showRightPanel={selectedCase !== null}
            onCloseRightPanel={handleClosePanel}
            leftPanel={
              <>
                <PageToolbar className="border-none bg-transparent px-4 pt-2 shadow-none backdrop-blur-none">
                  <OutboundFilterTabs
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    currentDate={currentDate}
                    onDateChange={handleDateChange}
                    isLoading={isLoading}
                  />
                </PageToolbar>
                <PageContent>
                  <OutboundNeedsAttentionTable
                    cases={needsAttentionCases}
                    selectedCaseId={selectedCase?.id ?? null}
                    onSelectCase={handleSelectCase}
                    isLoading={isLoading}
                    hasPreviousAttention={hasPreviousAttention}
                    previousAttentionDate={previousAttentionDate}
                    previousAttentionCount={previousAttentionCount}
                    onGoToPreviousAttention={handleGoToPreviousAttention}
                  />
                </PageContent>
                <PageFooter>
                  <OutboundPagination
                    page={page}
                    pageSize={pageSize}
                    total={needsAttentionCases.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </PageFooter>
              </>
            }
            rightPanel={
              <OutboundCaseDetail
                caseData={selectedCase}
                deliveryToggles={deliveryToggles}
                onToggleChange={setDeliveryToggles}
                onApprove={handleApproveAndSend}
                onRetry={handleRetry}
                onCancelScheduled={handleCancelScheduled}
                isSubmitting={isSubmitting}
                isCancelling={isCancellingCurrentCase}
                testModeEnabled={settingsData?.testModeEnabled ?? false}
                onDelete={handleClosePanel}
              />
            }
          />
        ) : (
          // All Discharges View - Split Layout
          <OutboundSplitLayout
            showRightPanel={selectedCase !== null}
            onCloseRightPanel={handleClosePanel}
            leftPanel={
              <>
                <PageToolbar className="border-none bg-transparent px-4 pt-2 shadow-none backdrop-blur-none">
                  <OutboundFilterTabs
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    currentDate={currentDate}
                    onDateChange={handleDateChange}
                    isLoading={isLoading}
                  />
                </PageToolbar>
                <PageContent>
                  <OutboundCaseTable
                    cases={cases}
                    selectedCaseId={selectedCase?.id ?? null}
                    onSelectCase={handleSelectCase}
                    onKeyNavigation={handleKeyNavigation}
                    isLoading={isLoading}
                    onQuickSchedule={handleQuickSchedule}
                    schedulingCaseIds={schedulingCaseIds}
                    onToggleStar={handleToggleStar}
                    togglingStarCaseIds={togglingStarCaseIds}
                    selectedForBulk={selectedForBulk}
                    onToggleBulkSelect={handleToggleBulkSelect}
                    onSelectAll={handleSelectAll}
                    isCompact={selectedCase !== null}
                  />
                </PageContent>
                <PageFooter>
                  <OutboundPagination
                    page={page}
                    pageSize={pageSize}
                    total={totalCases}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </PageFooter>
              </>
            }
            rightPanel={
              <OutboundCaseDetail
                caseData={selectedCase}
                deliveryToggles={deliveryToggles}
                onToggleChange={setDeliveryToggles}
                onApprove={handleApproveAndSend}
                onRetry={handleRetry}
                onCancelScheduled={handleCancelScheduled}
                isSubmitting={isSubmitting}
                isCancelling={isCancellingCurrentCase}
                testModeEnabled={settingsData?.testModeEnabled ?? false}
                onDelete={handleClosePanel}
              />
            }
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      <OutboundBulkActionBar
        selectedCount={selectedForBulk.size}
        onScheduleSelected={handleScheduleSelected}
        onCancelSelected={handleCancelSelected}
        onClearSelection={handleClearSelection}
        isProcessing={isBulkScheduling}
        isCancelling={isBulkCancelling}
        showCancelAction={hasScheduledCasesSelected}
      />
    </div>
  );
}

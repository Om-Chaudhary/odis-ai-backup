"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger } from "nuqs";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { TestTube, Settings } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/client";

import type {
  DischargeCaseStatus,
  StatusFilter,
  ViewMode,
  DeliveryToggles,
  SoapNote,
  DischargeSummaryStats,
} from "./types";
import type { StructuredDischargeSummary } from "@odis-ai/validators/discharge-summary";
import { PageContainer, PageToolbar, PageContent, PageFooter } from "../layout";
import { OutboundFilterTabs } from "./outbound-filter-tabs";
import { OutboundCaseTable } from "./outbound-case-table";
import { OutboundCaseDetail } from "./outbound-case-detail";
import { OutboundSplitLayout } from "./outbound-split-layout";
import { OutboundPagination } from "./outbound-pagination";
import { OutboundNeedsReviewTable } from "./outbound-needs-review-table";
import { Button } from "@odis-ai/ui/button";

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
    structuredData?: { urgent_case?: boolean; [key: string]: unknown } | null;
    urgentReasonSummary?: string | null;
  } | null;
  scheduledEmail: unknown;
  timestamp: string;
  createdAt: string;
  extremeCaseCheck: unknown;
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
  isUrgentCase?: boolean;
}

// Map old status to new StatusFilter for API
function mapStatusFilterToApiStatus(
  filter: StatusFilter,
): DischargeCaseStatus | undefined {
  switch (filter) {
    case "all":
      return undefined;
    case "ready_to_send":
      return "pending_review";
    case "scheduled":
      return "scheduled";
    case "sent":
      return "completed";
    case "failed":
      return "failed";
    default:
      return undefined;
  }
}

/**
 * Outbound Discharge Manager - Full Screen Compact Layout
 *
 * Features:
 * - View tabs: All Discharges / Needs Review
 * - Status filters: All, Ready to Send, Scheduled, Sent, Failed
 * - Full-screen layout with pagination
 * - Compact table rows
 * - Inline editing for cases needing review
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

  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "all" as StatusFilter,
    parse: (v) =>
      (["all", "ready_to_send", "scheduled", "sent", "failed"].includes(v)
        ? v
        : "all") as StatusFilter,
  });

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const [pageSize, setPageSize] = useQueryState(
    "size",
    parseAsInteger.withDefault(25),
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
  // Track which case is being scheduled from the table quick action
  const [schedulingCaseId, setSchedulingCaseId] = useState<string | null>(null);

  const casesRef = useRef<TransformedCase[]>([]);

  // Fetch cases
  const {
    data: casesData,
    isLoading,
    refetch,
  } = api.outbound.listDischargeCases.useQuery(
    {
      page: page,
      pageSize: pageSize,
      status: mapStatusFilterToApiStatus(statusFilter),
      search: searchTerm || undefined,
      startDate,
      endDate,
    },
    {
      refetchInterval: () => {
        const hasActive = casesRef.current.some(
          (c) => c.status === "in_progress",
        );
        return hasActive ? 5000 : 30000;
      },
    },
  );

  // Fetch stats
  const { data: statsData } = api.outbound.getDischargeCaseStats.useQuery({
    startDate,
    endDate,
  });

  // Fetch discharge settings (for test mode indicator)
  const { data: settingsData } = api.cases.getDischargeSettings.useQuery();

  // Mutations
  const approveAndSchedule = api.outbound.approveAndSchedule.useMutation({
    onSuccess: (data) => {
      const message = data.summaryGenerated
        ? "Discharge generated and scheduled"
        : "Discharge scheduled";
      toast.success(message);
      setSelectedCase(null);
      setSchedulingCaseId(null);
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to schedule", { description: error.message });
      setSchedulingCaseId(null);
    },
  });

  const skipCase = api.outbound.skipCase.useMutation({
    onSuccess: () => {
      toast.success("Case skipped");
      setSelectedCase(null);
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to skip", { description: error.message });
    },
  });

  const retryDelivery = api.outbound.retryFailedDelivery.useMutation({
    onSuccess: () => {
      toast.success("Retry scheduled");
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to retry", { description: error.message });
    },
  });

  // Update ref when data changes
  useEffect(() => {
    if (casesData?.cases) {
      casesRef.current = casesData.cases as TransformedCase[];
    }
  }, [casesData?.cases]);

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

  // Derived data
  const cases = useMemo(
    () => (casesData?.cases ?? []) as TransformedCase[],
    [casesData?.cases],
  );

  const totalCases = casesData?.pagination?.total ?? cases.length;

  // Cases needing review (missing contact info)
  const needsReviewCases = useMemo(
    () => cases.filter((c) => !c.owner.phone || !c.owner.email),
    [cases],
  );

  // Cases needing attention (flagged as urgent by AI)
  const needsAttentionCases = useMemo(
    () => cases.filter((c) => c.isUrgentCase === true),
    [cases],
  );

  // Map old stats to new format
  const stats: DischargeSummaryStats = useMemo(() => {
    const raw = statsData ?? {
      pendingReview: 0,
      scheduled: 0,
      ready: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      total: 0,
      needsAttention: 0,
    };
    return {
      readyToSend: raw.pendingReview + raw.ready + raw.inProgress,
      scheduled: raw.scheduled,
      sent: raw.completed,
      failed: raw.failed,
      total: raw.total,
      needsReview: needsReviewCases.length,
      needsAttention:
        (raw as { needsAttention?: number }).needsAttention ??
        needsAttentionCases.length,
    };
  }, [statsData, needsReviewCases.length, needsAttentionCases.length]);

  // Handlers
  const handleDateChange = useCallback(
    (newDate: Date) => {
      void setDateStr(format(startOfDay(newDate), "yyyy-MM-dd"));
      void setPage(1);
    },
    [setDateStr, setPage],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      void setViewMode(mode);
      setSelectedCase(null);
      void setPage(1);
    },
    [setViewMode, setPage],
  );

  const handleStatusChange = useCallback(
    (status: StatusFilter) => {
      void setStatusFilter(status);
      setSelectedCase(null);
      void setPage(1);
    },
    [setStatusFilter, setPage],
  );

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

  const handleSelectCase = useCallback((caseItem: TransformedCase) => {
    setSelectedCase(caseItem);
    setDeliveryToggles((prev) => ({
      phoneEnabled: !!caseItem.owner.phone,
      emailEnabled: !!caseItem.owner.email,
      immediateDelivery: prev.immediateDelivery ?? false, // Preserve the immediate delivery setting
    }));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCase(null);
  }, []);

  const handleKeyNavigation = useCallback(
    (direction: "up" | "down") => {
      if (cases.length === 0) return;

      const currentIndex = selectedCase
        ? cases.findIndex((c) => c.id === selectedCase.id)
        : -1;

      let newIndex: number;
      if (direction === "up") {
        newIndex = currentIndex <= 0 ? cases.length - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= cases.length - 1 ? 0 : currentIndex + 1;
      }

      const newCase = cases[newIndex];
      if (newCase) {
        handleSelectCase(newCase);
      }
    },
    [cases, selectedCase, handleSelectCase],
  );

  // Action handlers
  const handleApproveAndSend = useCallback(async () => {
    if (!selectedCase) return;
    await approveAndSchedule.mutateAsync({
      caseId: selectedCase.id,
      phoneEnabled: deliveryToggles.phoneEnabled,
      emailEnabled: deliveryToggles.emailEnabled,
      immediateDelivery: deliveryToggles.immediateDelivery ?? false,
    });
  }, [selectedCase, deliveryToggles, approveAndSchedule]);

  const handleSkip = useCallback(async () => {
    if (!selectedCase) return;
    await skipCase.mutateAsync({ caseId: selectedCase.id });
  }, [selectedCase, skipCase]);

  const handleRetry = useCallback(async () => {
    if (!selectedCase) return;
    await retryDelivery.mutateAsync({
      caseId: selectedCase.id,
      retryCall: selectedCase.phoneSent === "failed",
      retryEmail: selectedCase.emailSent === "failed",
    });
  }, [selectedCase, retryDelivery]);

  // Quick schedule from table row
  const handleQuickSchedule = useCallback(
    async (caseItem: TransformedCase) => {
      setSchedulingCaseId(caseItem.id);
      try {
        await approveAndSchedule.mutateAsync({
          caseId: caseItem.id,
          phoneEnabled: !!caseItem.owner.phone,
          emailEnabled: !!caseItem.owner.email,
        });
      } catch {
        // Error is handled by mutation onError
      }
    },
    [approveAndSchedule],
  );

  // Needs review handlers (placeholder - would need API endpoints)
  const handleUpdateContact = useCallback(
    async (_caseId: string, field: "phone" | "email", _value: string) => {
      // TODO: Implement API call to update contact
      toast.success(`Updated ${field} for case`);
      void refetch();
    },
    [refetch],
  );

  const handleRemoveFromQueue = useCallback(
    async (caseId: string) => {
      await skipCase.mutateAsync({ caseId });
    },
    [skipCase],
  );

  const isSubmitting =
    approveAndSchedule.isPending ||
    skipCase.isPending ||
    retryDelivery.isPending;

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-2">
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

      {/* Compact Toolbar - Date + View Tabs + Status Filters + Search */}
      <PageToolbar className="rounded-lg border border-teal-200/40 bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70 py-2 shadow-md shadow-teal-500/5 backdrop-blur-md">
        <OutboundFilterTabs
          activeStatus={statusFilter}
          onStatusChange={handleStatusChange}
          counts={stats}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </PageToolbar>

      {/* Main Content Area */}
      <div className="min-h-0 flex-1">
        {viewMode === "needs_review" ? (
          // Needs Review View
          <PageContainer className="h-full">
            <PageContent>
              <OutboundNeedsReviewTable
                cases={needsReviewCases}
                isLoading={isLoading}
                onUpdateContact={handleUpdateContact}
                onRemoveFromQueue={handleRemoveFromQueue}
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
          // Needs Attention View - Cases flagged as urgent
          <OutboundSplitLayout
            showRightPanel={selectedCase !== null}
            onCloseRightPanel={handleClosePanel}
            leftPanel={
              <>
                <PageContent>
                  <OutboundCaseTable
                    cases={needsAttentionCases}
                    selectedCaseId={selectedCase?.id ?? null}
                    onSelectCase={handleSelectCase}
                    onKeyNavigation={handleKeyNavigation}
                    isLoading={isLoading}
                    onQuickSchedule={handleQuickSchedule}
                    schedulingCaseId={schedulingCaseId}
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
                onSkip={handleSkip}
                onRetry={handleRetry}
                isSubmitting={isSubmitting}
                testModeEnabled={settingsData?.testModeEnabled ?? false}
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
                <PageContent>
                  <OutboundCaseTable
                    cases={cases}
                    selectedCaseId={selectedCase?.id ?? null}
                    onSelectCase={handleSelectCase}
                    onKeyNavigation={handleKeyNavigation}
                    isLoading={isLoading}
                    onQuickSchedule={handleQuickSchedule}
                    schedulingCaseId={schedulingCaseId}
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
                onSkip={handleSkip}
                onRetry={handleRetry}
                isSubmitting={isSubmitting}
                testModeEnabled={settingsData?.testModeEnabled ?? false}
              />
            }
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { format, parseISO, startOfDay } from "date-fns";

import type { ViewMode, DeliveryToggles, TransformedCase } from "./types";
import { BulkOperationProgress } from "./bulk-operation-progress";
import { OutboundBulkActionBar } from "./outbound-bulk-action-bar";
import {
  BulkOperationProvider,
  useBulkOperation,
} from "./bulk-operation-context";
import {
  useOutboundData,
  useOutboundMutations,
} from "~/app/dashboard/outbound/_hooks";
import { api } from "~/trpc/client";
import { CompactTestModeBanner } from "~/components/dashboard/discharges/test-mode-banner";
import type { DischargeSettings } from "@odis-ai/shared/types";
import { useOptionalClinic } from "@odis-ai/shared/ui/clinic-context";

import { NeedsAttentionView } from "./views/needs-attention-view";
import { AllDischargesView } from "./views/all-discharges-view";

export function OutboundDashboard() {
  return (
    <BulkOperationProvider>
      <OutboundDashboardInner />
      <BulkOperationProgress />
    </BulkOperationProvider>
  );
}

function OutboundDashboardInner() {
  // Get clinic context for admin users viewing a specific clinic
  const clinicContext = useOptionalClinic();
  const clinicSlug = clinicContext?.clinicSlug;

  // URL-synced state
  const [dateStr, setDateStr] = useQueryState("date", {
    defaultValue: format(startOfDay(new Date()), "yyyy-MM-dd"),
  });

  const [viewMode, setViewMode] = useQueryState("view", {
    defaultValue: "all" as ViewMode,
    parse: (v) =>
      (["all", "needs_attention"].includes(v) ? v : "all") as ViewMode,
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

  // Date range for API
  const { startDate, endDate } = useMemo(
    () => ({
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

  const handleSelectCase = useCallback((caseItem: unknown) => {
    const typedCase = caseItem as TransformedCase;
    setSelectedCase(typedCase);
    setDeliveryToggles((prev) => ({
      phoneEnabled: !!typedCase.owner.phone,
      emailEnabled: !!typedCase.owner.email,
      immediateDelivery: prev.immediateDelivery ?? false,
    }));
  }, []);

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
  } = useOutboundData({
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    consultationId,
    viewMode: viewMode,
    clinicSlug,
  });

  // Bulk operation context for background processing
  const bulkOperation = useBulkOperation();

  const {
    handleApproveAndSend: approveAndSendHandler,
    handleRetry: retryHandler,
    handleQuickSchedule,
    handleToggleStar,
    handleCancelScheduled: cancelScheduledHandler,
    handleBulkCancel,
    isSubmitting,
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

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update settings");
    },
  });

  const handleUpdateSettings = useCallback(
    (newSettings: DischargeSettings) => {
      updateSettingsMutation.mutate({
        clinicName: newSettings.clinicName || undefined,
        clinicPhone: newSettings.clinicPhone || undefined,
        clinicEmail: newSettings.clinicEmail || undefined,
        emergencyPhone: newSettings.emergencyPhone || undefined,
        testModeEnabled: newSettings.testModeEnabled,
        testContactName: newSettings.testContactName ?? undefined,
        testContactEmail: newSettings.testContactEmail ?? undefined,
        testContactPhone: newSettings.testContactPhone ?? undefined,
        voicemailDetectionEnabled: newSettings.voicemailDetectionEnabled,
        defaultScheduleDelayMinutes:
          newSettings.defaultScheduleDelayMinutes ?? null,
        primaryColor: newSettings.primaryColor ?? undefined,
        logoUrl: newSettings.logoUrl ?? null,
        emailHeaderText: newSettings.emailHeaderText ?? null,
        emailFooterText: newSettings.emailFooterText ?? null,
        preferredEmailStartTime: newSettings.preferredEmailStartTime ?? null,
        preferredEmailEndTime: newSettings.preferredEmailEndTime ?? null,
        preferredCallStartTime: newSettings.preferredCallStartTime ?? null,
        preferredCallEndTime: newSettings.preferredCallEndTime ?? null,
        emailDelayDays: newSettings.emailDelayDays ?? null,
        callDelayDays: newSettings.callDelayDays ?? null,
        maxCallRetries: newSettings.maxCallRetries ?? null,
        batchIncludeIdexxNotes: newSettings.batchIncludeIdexxNotes,
        batchIncludeManualTranscriptions:
          newSettings.batchIncludeManualTranscriptions,
      });
    },
    [updateSettingsMutation],
  );

  // Wrapper handlers for use in component
  const handleApproveAndSend = useCallback(
    async (immediate?: boolean) => {
      if (!selectedCase) return;
      await approveAndSendHandler(selectedCase.id, deliveryToggles, immediate);
    },
    [selectedCase, deliveryToggles, approveAndSendHandler],
  );

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

  // Deep link handling
  useEffect(() => {
    if (!consultationId || deepLinkHandledRef.current === consultationId)
      return;
    if (isDeepLinkLoading) return;

    if (deepLinkData?.found && deepLinkData.date) {
      deepLinkHandledRef.current = consultationId;
      const caseDate = format(
        startOfDay(parseISO(deepLinkData.date)),
        "yyyy-MM-dd",
      );
      void setDateStr(caseDate);
      void setPage(deepLinkData.page ?? 1);
    } else if (deepLinkData && !deepLinkData.found) {
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

  // Deep link handling: Auto-select case once data loads
  const deepLinkSelectedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      !deepLinkData?.found ||
      !deepLinkData.caseId ||
      isLoading ||
      cases.length === 0
    ) {
      return;
    }

    if (deepLinkSelectedRef.current === deepLinkData.caseId) return;

    const targetCase = cases.find((c) => c.id === deepLinkData.caseId);
    if (targetCase) {
      deepLinkSelectedRef.current = deepLinkData.caseId;
      handleSelectCase(targetCase);
      toast.success("Case opened", {
        description: `${targetCase.patient.name} - ${targetCase.owner.name ?? "Unknown owner"}`,
      });
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

  // Sync selectedCase with fetched data to show updated timeline
  useEffect(() => {
    if (!selectedCase || cases.length === 0) return;

    const updatedCase = cases.find((c) => c.id === selectedCase.id);
    if (updatedCase) {
      // Update selectedCase with the latest data from the server
      setSelectedCase(updatedCase);
    }
  }, [cases, selectedCase?.id]);

  // Cases needing attention
  const needsAttentionCases = useMemo(() => {
    const filtered = cases.filter((c) => c.needsAttention === true);
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

  // Handlers
  const handleDateChange = useCallback(
    (newDate: Date) => {
      void setDateStr(format(startOfDay(newDate), "yyyy-MM-dd"));
      void setPage(1);
    },
    [setDateStr, setPage],
  );

  const handleViewChange = useCallback(
    (view: string) => {
      void setViewMode(view as ViewMode);
      void setPage(1);
      setSelectedCase(null);
    },
    [setViewMode, setPage],
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
    const selectableCases = cases.filter(
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

  const handleCancelSelected = useCallback(async () => {
    if (selectedForBulk.size === 0) {
      toast.error("No cases selected");
      return;
    }
    await handleBulkCancel(Array.from(selectedForBulk));
  }, [selectedForBulk, handleBulkCancel]);

  const hasScheduledCasesSelected = useMemo(() => {
    return cases.some(
      (c) => selectedForBulk.has(c.id) && c.status === "scheduled",
    );
  }, [cases, selectedForBulk]);

  // Common Header Props
  const headerProps = {
    viewMode,
    onViewChange: handleViewChange,
    currentDate,
    onDateChange: handleDateChange,
    isLoading,
    searchTerm,
    onSearchChange: handleSearchChange,
    stats: statsData,
  };

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col gap-2 overflow-hidden">
      {/* Test Mode Banner */}
      {settingsData && (
        <div className="mx-auto w-full max-w-[1800px] px-4 pt-4">
          <CompactTestModeBanner
            settings={settingsData}
            onUpdate={handleUpdateSettings}
            isLoading={updateSettingsMutation.isPending}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {viewMode === "needs_attention" ? (
          <NeedsAttentionView
            {...headerProps}
            cases={needsAttentionCases}
            page={page}
            pageSize={pageSize}
            total={totalCases}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            selectedCase={selectedCase}
            onSelectCase={handleSelectCase}
            onClosePanel={handleClosePanel}
            deliveryToggles={deliveryToggles}
            setDeliveryToggles={setDeliveryToggles}
            onApprove={handleApproveAndSend}
            onRetry={handleRetry}
            onCancelScheduled={handleCancelScheduled}
            isSubmitting={isSubmitting}
            isCancelling={isCancellingCurrentCase}
            testModeEnabled={settingsData?.testModeEnabled ?? false}
          />
        ) : (
          <AllDischargesView
            {...headerProps}
            cases={cases}
            page={page}
            pageSize={pageSize}
            total={totalCases}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            selectedCase={selectedCase}
            onSelectCase={handleSelectCase}
            onKeyNavigation={handleKeyNavigation}
            onClosePanel={handleClosePanel}
            onQuickSchedule={handleQuickSchedule}
            schedulingCaseIds={schedulingCaseIds}
            onToggleStar={handleToggleStar}
            togglingStarCaseIds={togglingStarCaseIds}
            selectedForBulk={selectedForBulk}
            onToggleBulkSelect={handleToggleBulkSelect}
            onSelectAll={handleSelectAll}
            deliveryToggles={deliveryToggles}
            setDeliveryToggles={setDeliveryToggles}
            onApprove={handleApproveAndSend}
            onRetry={handleRetry}
            onCancelScheduled={handleCancelScheduled}
            isSubmitting={isSubmitting}
            isCancelling={isCancellingCurrentCase}
            testModeEnabled={settingsData?.testModeEnabled ?? false}
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      <OutboundBulkActionBar
        selectedCount={selectedForBulk.size}
        selectedCaseIds={Array.from(selectedForBulk)}
        onCancelSelected={handleCancelSelected}
        onClearSelection={handleClearSelection}
        isCancelling={isBulkCancelling}
        showCancelAction={hasScheduledCasesSelected}
        isBackgroundOperationActive={bulkOperation.phase !== "idle"}
      />
    </div>
  );
}

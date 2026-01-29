"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  useQueryState,
  parseAsInteger,
  parseAsString,
  parseAsBoolean,
} from "nuqs";
import { format, parseISO, startOfDay } from "date-fns";
import type { DischargeSettings } from "@odis-ai/shared/types";

import type { ViewMode, DeliveryToggles, TransformedCase } from "./types";
import { BulkOperationProgress } from "./bulk-operation-progress";
import { OutboundBulkActionBar } from "./outbound-bulk-action-bar";
import {
  BulkOperationProvider,
  useBulkOperation,
} from "./bulk-operation-context";
import { useOutboundData, useOutboundMutations } from "./hooks";
import { TestModeBanner } from "../discharges/test-mode-banner";
import { api } from "~/trpc/client";

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

  const [pageSize] = useQueryState("size", parseAsInteger.withDefault(25));

  // Deep link support: IDEXX Neo consultation ID
  const [consultationId, setConsultationId] = useQueryState(
    "consultationId",
    parseAsString,
  );

  // Deep link support: Direct case ID (for IDEXX Neo extension)
  const [caseId, setCaseId] = useQueryState("caseId", parseAsString);

  // Deep link support: Auto-open panel when linked from extension
  const [openPanel, setOpenPanel] = useQueryState("openPanel", parseAsBoolean);

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

  // Get search term from URL
  const [searchQuery] = useQueryState("search", { defaultValue: "" });
  const searchTerm = searchQuery ?? "";

  // Local state
  const [selectedCase, setSelectedCase] = useState<TransformedCase | null>(
    null,
  );
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

  const handleSelectCase = useCallback(
    (caseItem: unknown) => {
      const typedCase = caseItem as TransformedCase;
      setSelectedCase(typedCase);
      setDeliveryToggles((prev) => ({
        phoneEnabled: !!typedCase.owner.phone,
        emailEnabled: !!typedCase.owner.email,
        immediateDelivery: prev.immediateDelivery ?? false,
      }));
      // Update URL for deep linking / shareable URLs
      void setCaseId(typedCase.id);
    },
    [setCaseId],
  );

  // Use custom hooks for data and mutations
  // Check if user is a superadmin
  const { data: userRoleData } = api.dashboard.getCurrentUserRole.useQuery();
  const isSuperAdmin = userRoleData?.role === "admin";

  const {
    cases,
    totalCases,
    settings: settingsData,
    deepLinkData,
    isDeepLinkLoading,
    caseByIdData,
    isCaseByIdLoading,
    isLoading,
    refetch,
  } = useOutboundData({
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    consultationId,
    caseId,
    viewMode: viewMode,
    clinicSlug,
  });

  // Bulk operation context for background processing
  const bulkOperation = useBulkOperation();

  const {
    handleApproveAndSend: approveAndSendHandler,
    handleRetry: retryHandler,
    handleReschedule: rescheduleHandler,
    handleQuickSchedule,
    handleToggleStar,
    handleCancelScheduled: cancelScheduledHandler,
    handleBulkCancel,
    isSubmitting,
    isBulkCancelling,
    schedulingCaseIds,
    togglingStarCaseIds,
    cancellingCallCaseIds,
    cancellingEmailCaseIds,
    reschedulingCaseIds,
  } = useOutboundMutations({
    onSuccess: () => {
      // Only clear selection for non-cancel operations
      // Cancel operations should keep the panel open so user can cancel the other channel
      setSelectedForBulk(new Set());
      void refetch();
    },
  });

  // Update discharge settings mutation
  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to update settings", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  // Handler for updating settings
  const handleUpdateSettings = useCallback(
    async (settings: DischargeSettings) => {
      await updateSettingsMutation.mutateAsync(settings);
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

    const phoneFailed = selectedCase.phoneSent === "failed";
    const emailFailed = selectedCase.emailSent === "failed";

    // Only retry if at least one channel failed
    if (!phoneFailed && !emailFailed) {
      toast.error("No failed deliveries to retry");
      return;
    }

    try {
      await retryHandler(selectedCase.id, {
        retryCall: phoneFailed,
        retryEmail: emailFailed,
      });
    } catch (error) {
      // If retry fails because no failed record exists in DB, schedule a new delivery instead
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("No failed deliveries")) {
        // Fall back to scheduling a new immediate delivery
        const hasPhone = !!selectedCase.owner.phone;
        const hasEmail = !!selectedCase.owner.email;

        await approveAndSendHandler(
          selectedCase.id,
          {
            phoneEnabled: phoneFailed && hasPhone,
            emailEnabled: emailFailed && hasEmail,
            immediateDelivery: true,
          },
          true, // immediate
        );
        toast.success("New delivery scheduled");
      } else {
        // Re-throw other errors to let the mutation error handler deal with them
        throw error;
      }
    }
  }, [selectedCase, retryHandler, approveAndSendHandler]);

  const handleCancelScheduled = useCallback(
    async (options: { cancelCall: boolean; cancelEmail: boolean }) => {
      if (!selectedCase) return;
      await cancelScheduledHandler(selectedCase.id, options);
    },
    [selectedCase, cancelScheduledHandler],
  );

  // Reschedule phone call to a specific date
  const handlePhoneReschedule = useCallback(
    async (options: { delayDays: number; immediate: boolean }) => {
      if (!selectedCase) return;
      await rescheduleHandler(selectedCase.id, {
        rescheduleCall: true,
        rescheduleEmail: false,
        delayDays: options.delayDays,
        immediate: options.immediate,
      });
    },
    [selectedCase, rescheduleHandler],
  );

  // Reschedule email to a specific date
  const handleEmailReschedule = useCallback(
    async (options: { delayDays: number; immediate: boolean }) => {
      if (!selectedCase) return;
      await rescheduleHandler(selectedCase.id, {
        rescheduleCall: false,
        rescheduleEmail: true,
        delayDays: options.delayDays,
        immediate: options.immediate,
      });
    },
    [selectedCase, rescheduleHandler],
  );

  // Check if current case is being cancelled (separate for call and email)
  const isCancellingCall = selectedCase
    ? cancellingCallCaseIds.has(selectedCase.id)
    : false;
  const isCancellingEmail = selectedCase
    ? cancellingEmailCaseIds.has(selectedCase.id)
    : false;
  // Check if current case is being rescheduled
  const isReschedulingCase = selectedCase
    ? reschedulingCaseIds.has(selectedCase.id)
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

  // Deep link handling: Auto-select case once data loads (for consultationId)
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

  // Deep link handling: Direct case ID (for IDEXX Neo extension)
  const caseIdDeepLinkHandledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!caseId || isCaseByIdLoading || isLoading) return;
    if (caseIdDeepLinkHandledRef.current === caseId) return;

    // First, check if case exists in current list
    const existingCase = cases.find((c) => c.id === caseId);
    if (existingCase) {
      caseIdDeepLinkHandledRef.current = caseId;
      handleSelectCase(existingCase);
      toast.success("Case opened", {
        description: `${existingCase.patient.name} - ${existingCase.owner.name ?? "Unknown owner"}`,
      });
      void setCaseId(null);
      // Clear openPanel param after successfully opening the panel
      if (openPanel) {
        void setOpenPanel(null);
      }
      return;
    }

    // Case not in current list - check if it exists via API
    if (caseByIdData) {
      caseIdDeepLinkHandledRef.current = caseId;
      // Navigate to the case's date if we have timestamp info
      const caseDate = caseByIdData.timestamp
        ? format(startOfDay(parseISO(caseByIdData.timestamp)), "yyyy-MM-dd")
        : null;

      if (caseDate && caseDate !== dateStr) {
        // Navigate to the case's date
        void setDateStr(caseDate);
        toast.info("Navigating to case", {
          description: `Loading ${caseByIdData.patient.name}'s discharge from ${caseDate}`,
        });
        // Don't clear caseId yet - let it re-trigger after date change
        caseIdDeepLinkHandledRef.current = null;
      } else {
        // Same date but case not found in list - possibly filtered out
        toast.warning("Case not in current view", {
          description: `${caseByIdData.patient.name} - try adjusting filters`,
        });
        void setCaseId(null);
        if (openPanel) void setOpenPanel(null);
      }
    } else if (!isCaseByIdLoading) {
      // API query complete but no data - case not found
      caseIdDeepLinkHandledRef.current = caseId;
      toast.error("Case not found", {
        description: `No case found for ID: ${caseId}`,
      });
      void setCaseId(null);
      if (openPanel) void setOpenPanel(null);
    }
  }, [
    caseId,
    caseByIdData,
    isCaseByIdLoading,
    cases,
    isLoading,
    dateStr,
    handleSelectCase,
    setCaseId,
    setDateStr,
    openPanel,
    setOpenPanel,
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

  const handlePageChange = useCallback(
    (newPage: number) => {
      void setPage(newPage);
      setSelectedCase(null);
    },
    [setPage],
  );

  const handleViewModeChange = useCallback(
    (newMode: ViewMode) => {
      void setViewMode(newMode);
      void setPage(1);
      setSelectedCase(null);
    },
    [setViewMode, setPage],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedCase(null);
    // Clear URL params when closing panel
    void setCaseId(null);
    void setOpenPanel(null);
  }, [setCaseId, setOpenPanel]);

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
    currentDate,
    onDateChange: handleDateChange,
    isLoading,
  };

  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden">
      {/* Test Mode Banner */}
      {settingsData?.testModeEnabled && (
        <div className="px-4 pt-4">
          <TestModeBanner
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
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            needsAttentionCount={needsAttentionCases.length}
            totalCasesCount={totalCases}
            selectedCase={selectedCase}
            onSelectCase={handleSelectCase}
            onClosePanel={handleClosePanel}
            deliveryToggles={deliveryToggles}
            setDeliveryToggles={setDeliveryToggles}
            onApprove={handleApproveAndSend}
            onRetry={handleRetry}
            onPhoneReschedule={handlePhoneReschedule}
            onEmailReschedule={handleEmailReschedule}
            onCancelScheduled={handleCancelScheduled}
            isSubmitting={isSubmitting}
            isCancellingCall={isCancellingCall}
            isCancellingEmail={isCancellingEmail}
            isRescheduling={isReschedulingCase}
            testModeEnabled={settingsData?.testModeEnabled ?? false}
            isSuperAdmin={isSuperAdmin}
          />
        ) : (
          <AllDischargesView
            {...headerProps}
            cases={cases}
            page={page}
            pageSize={pageSize}
            total={totalCases}
            onPageChange={handlePageChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            needsAttentionCount={needsAttentionCases.length}
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
            onPhoneReschedule={handlePhoneReschedule}
            onEmailReschedule={handleEmailReschedule}
            onCancelScheduled={handleCancelScheduled}
            isSubmitting={isSubmitting}
            isCancellingCall={isCancellingCall}
            isCancellingEmail={isCancellingEmail}
            isRescheduling={isReschedulingCase}
            testModeEnabled={settingsData?.testModeEnabled ?? false}
            isSuperAdmin={isSuperAdmin}
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

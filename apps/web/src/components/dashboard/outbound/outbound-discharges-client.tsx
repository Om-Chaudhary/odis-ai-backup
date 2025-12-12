"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useQueryState } from "nuqs";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { api } from "~/trpc/client";

import type {
  DischargeCaseStatus,
  OutboundFiltersState,
  DeliveryToggles,
  SoapNote,
} from "./types";
import { OutboundFilterTabs } from "./outbound-filter-tabs";
import { OutboundCaseTable } from "./outbound-case-table";
import { OutboundCaseDetail } from "./outbound-case-detail";
import { OutboundSplitLayout } from "./outbound-split-layout";

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
  structuredContent: unknown;
  callScript: unknown;
  emailContent: string;
  scheduledCall: unknown;
  scheduledEmail: unknown;
  timestamp: string;
  createdAt: string;
  extremeCaseCheck: unknown;
  idexxNotes: string | null;
  soapNotes: SoapNote[];
  // Schedule timing
  scheduledEmailFor: string | null;
  scheduledCallFor: string | null;
}

/**
 * Outbound Discharge Call Manager Client
 *
 * Main client component for the veterinary AI discharge call manager.
 * Features:
 * - Day-based navigation for reviewing cases
 * - Full-width table by default, panel slides in on selection
 * - Filter tabs with counts including "Scheduled"
 * - Case queue table with keyboard navigation
 * - Detail panel with call script/email preview
 */
export function OutboundDischargesClient() {
  // Date navigation - use URL query param for sync
  const [dateStr, setDateStr] = useQueryState("date", {
    defaultValue: format(startOfDay(new Date()), "yyyy-MM-dd"),
  });

  // Parse current date from URL param
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

  // Calculate date range for API queries
  const { startDate, endDate } = useMemo(() => {
    return {
      startDate: startOfDay(currentDate).toISOString(),
      endDate: endOfDay(currentDate).toISOString(),
    };
  }, [currentDate]);

  // Handle date change from day pagination
  const handleDateChange = useCallback(
    (newDate: Date) => {
      const newDateStr = format(startOfDay(newDate), "yyyy-MM-dd");
      void setDateStr(newDateStr);
    },
    [setDateStr],
  );

  // Selected case state
  const [selectedCase, setSelectedCase] = useState<TransformedCase | null>(
    null,
  );

  // Filter state (status and search only, date is in URL)
  const [filters, setFilters] = useState<OutboundFiltersState>({
    status: "all",
    searchTerm: "",
    dateRange: { start: "", end: "" },
  });

  // Delivery toggles for selected case
  const [deliveryToggles, setDeliveryToggles] = useState<DeliveryToggles>({
    phoneEnabled: true,
    emailEnabled: true,
  });

  // Refs for data stability
  const casesRef = useRef<TransformedCase[]>([]);

  // Fetch cases
  const {
    data: casesData,
    isLoading,
    refetch,
  } = api.outbound.listDischargeCases.useQuery(
    {
      page: 1,
      pageSize: 50,
      status: filters.status !== "all" ? filters.status : undefined,
      search: filters.searchTerm || undefined,
      startDate: startDate,
      endDate: endDate,
    },
    {
      refetchInterval: () => {
        // Poll faster if any case is in progress
        const hasActive = casesRef.current.some(
          (c) => c.status === "in_progress",
        );
        return hasActive ? 5000 : 30000;
      },
    },
  );

  // Fetch stats for filter badges
  const { data: statsData } = api.outbound.getDischargeCaseStats.useQuery({
    startDate: startDate,
    endDate: endDate,
  });

  // Mutations
  const approveAndSchedule = api.outbound.approveAndSchedule.useMutation({
    onSuccess: () => {
      toast.success("Discharge scheduled successfully");
      setSelectedCase(null);
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to schedule discharge", {
        description: error.message,
      });
    },
  });

  const skipCase = api.outbound.skipCase.useMutation({
    onSuccess: () => {
      toast.success("Case skipped");
      setSelectedCase(null);
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to skip case", {
        description: error.message,
      });
    },
  });

  const retryDelivery = api.outbound.retryFailedDelivery.useMutation({
    onSuccess: () => {
      toast.success("Retry scheduled");
      void refetch();
    },
    onError: (error) => {
      toast.error("Failed to retry", {
        description: error.message,
      });
    },
  });

  // Update ref when data changes
  useEffect(() => {
    if (casesData?.cases) {
      casesRef.current = casesData.cases as TransformedCase[];
    }
  }, [casesData?.cases]);

  // Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedCase) {
        setSelectedCase(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedCase]);

  const cases = useMemo(
    () => (casesData?.cases ?? []) as TransformedCase[],
    [casesData?.cases],
  );
  const stats = statsData ?? {
    pendingReview: 0,
    scheduled: 0,
    ready: 0,
    inProgress: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  // Handle case selection
  const handleSelectCase = useCallback((caseItem: TransformedCase) => {
    setSelectedCase(caseItem);

    // Reset delivery toggles based on contact availability
    setDeliveryToggles({
      phoneEnabled: !!caseItem.owner.phone,
      emailEnabled: !!caseItem.owner.email,
    });

    // Show warning if missing contact info
    if (!caseItem.owner.phone && !caseItem.owner.email) {
      toast.warning("Missing contact information", {
        description: "No phone or email available for this owner.",
      });
    }
  }, []);

  // Handle closing detail panel
  const handleClosePanel = useCallback(() => {
    setSelectedCase(null);
  }, []);

  // Handle keyboard navigation
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

  // Handle status filter
  const handleStatusFilter = useCallback(
    (status: DischargeCaseStatus | "all") => {
      setFilters((prev: OutboundFiltersState) => ({ ...prev, status }));
      setSelectedCase(null); // Close panel when changing filter
    },
    [],
  );

  // Handle search
  const handleSearchChange = useCallback((searchTerm: string) => {
    setFilters((prev: OutboundFiltersState) => ({ ...prev, searchTerm }));
  }, []);

  // Cmd+K to focus search
  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder="Search patients..."]',
        );
        searchInput?.focus();
      }
    };
    document.addEventListener("keydown", handleCmdK);
    return () => document.removeEventListener("keydown", handleCmdK);
  }, []);

  // Handle approve & send action
  const handleApproveAndSend = useCallback(async () => {
    if (!selectedCase) return;

    await approveAndSchedule.mutateAsync({
      caseId: selectedCase.id,
      phoneEnabled: deliveryToggles.phoneEnabled,
      emailEnabled: deliveryToggles.emailEnabled,
    });
  }, [selectedCase, deliveryToggles, approveAndSchedule]);

  // Handle skip action
  const handleSkip = useCallback(async () => {
    if (!selectedCase) return;

    await skipCase.mutateAsync({
      caseId: selectedCase.id,
    });
  }, [selectedCase, skipCase]);

  // Handle retry action
  const handleRetry = useCallback(async () => {
    if (!selectedCase) return;

    await retryDelivery.mutateAsync({
      caseId: selectedCase.id,
      retryCall: selectedCase.phoneSent === "failed",
      retryEmail: selectedCase.emailSent === "failed",
    });
  }, [selectedCase, retryDelivery]);

  const isSubmitting =
    approveAndSchedule.isPending ||
    skipCase.isPending ||
    retryDelivery.isPending;

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}

      {/* Filter Tabs with Date Navigation and Search */}
      <OutboundFilterTabs
        activeTab={filters.status}
        onTabChange={handleStatusFilter}
        counts={stats}
        searchTerm={filters.searchTerm}
        onSearchChange={handleSearchChange}
        currentDate={currentDate}
        onDateChange={handleDateChange}
        isLoading={isLoading}
      />

      {/* Split Layout: Table + Detail */}
      <div className="mt-4 min-h-0 flex-1">
        <OutboundSplitLayout
          showRightPanel={selectedCase !== null}
          onCloseRightPanel={handleClosePanel}
          leftPanel={
            <OutboundCaseTable
              cases={cases}
              selectedCaseId={selectedCase?.id ?? null}
              onSelectCase={handleSelectCase}
              onKeyNavigation={handleKeyNavigation}
              isLoading={isLoading}
            />
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
            />
          }
        />
      </div>
    </div>
  );
}

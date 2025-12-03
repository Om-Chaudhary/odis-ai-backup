"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Settings, Plus, RefreshCw, TestTube, Send } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { DischargeListItem } from "./discharge-list-item";
import { EmptyState } from "./empty-state";
import { UnifiedFilterBar } from "./unified-filter-bar";
import { BatchDischargeDialog } from "./batch-discharge-dialog";
import { BatchProgressMonitor } from "./batch-progress-monitor";
import { api } from "~/trpc/client";
import type {
  DashboardCase,
  DischargeSettings,
  PatientUpdateInput,
} from "~/types/dashboard";
import { transformBackendCasesToDashboardCases } from "~/lib/transforms/case-transforms";
import {
  normalizePlaceholder,
  hasValidContact,
} from "~/lib/utils/dashboard-helpers";
import { toast } from "sonner";
import { format, addDays, setHours, setMinutes, setSeconds } from "date-fns";
import type { DischargeReadinessFilter } from "~/types/dashboard";
import type { DateRangePreset } from "~/lib/utils/date-ranges";
import { getDateRangeFromPreset } from "~/lib/utils/date-ranges";
import { useQueryState } from "nuqs";

const PAGE_SIZE = 10;

/** Tracks which case is currently being processed and what type of discharge */
interface LoadingState {
  caseId: string;
  type: "call" | "email" | "both";
}

/**
 * DischargeManagementClient - Main discharge management interface
 *
 * Comprehensive component that merges functionality from DischargesTab and
 * CasesDashboardClient to provide a unified discharge management experience.
 *
 * Features:
 * - Day-by-day date navigation with keyboard shortcuts
 * - Date range preset filtering (All Time, Last Day, 3D, 30D)
 * - Status filtering (All, Ready, Pending, Completed, Failed)
 * - Search by patient or owner name
 * - Discharge call/email triggering
 * - Inline patient information editing
 * - Test mode support for safe testing
 * - Real-time status updates
 *
 * The component handles all discharge-related operations including:
 * - Triggering discharge calls via VAPI
 * - Sending discharge emails
 * - Updating patient contact information
 * - Managing loading states and preventing duplicate actions
 *
 * @example
 * ```tsx
 * <DischargeManagementClient />
 * ```
 */
export function DischargeManagementClient() {
  const router = useRouter();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingCase, setLoadingCase] = useState<LoadingState | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ready" | "pending" | "completed" | "failed"
  >("all");
  const [readinessFilter, setReadinessFilter] =
    useState<DischargeReadinessFilter>("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Batch discharge state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Date range preset state (uses URL state for persistence)
  // Note: setDateRange is managed by UnifiedFilterBar component
  const [dateRange] = useQueryState("dateRange", {
    defaultValue: "all",
    parse: (value) => (value as DateRangePreset) ?? "all",
    serialize: (value) => value,
  });

  // Ref to prevent double-clicks
  const isProcessingRef = useRef(false);

  // Calculate date parameters based on dateRange
  // IMPORTANT: When search term is active, override date filters to search all time
  const dateParams = useMemo(() => {
    // If searching, ignore date filters and search all time
    if (searchTerm.trim()) {
      return {}; // No date filters = search all time
    }

    if (dateRange === "3d" || dateRange === "30d") {
      // Range mode: use startDate and endDate
      const { startDate, endDate } = getDateRangeFromPreset(dateRange);
      return {
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      };
    } else if (dateRange === "1d") {
      // "Last Day" mode: use date range for yesterday to today
      const { startDate, endDate } = getDateRangeFromPreset(dateRange);
      return {
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      };
    }
    // "all" mode: use single date parameter (day navigation)
    return { date: format(currentDate, "yyyy-MM-dd") };
  }, [dateRange, currentDate, searchTerm]);

  // tRPC Queries
  const {
    data: casesData,
    isLoading,
    refetch: refetchCases,
  } = api.cases.listMyCasesToday.useQuery({
    page: currentPage,
    pageSize: PAGE_SIZE,
    ...dateParams,
    readinessFilter,
  });

  // Query for most recent case date (only on initial load)
  const { data: mostRecentDate } = api.cases.getMostRecentCaseDate.useQuery(
    undefined,
    { enabled: isInitialLoad },
  );

  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  // Query for eligible cases for batch
  const { data: eligibleCases } = api.cases.getEligibleCasesForBatch.useQuery(
    undefined,
    {
      enabled: showBatchDialog,
    },
  );

  // Auto-navigate to most recent day with cases on initial load
  useEffect(() => {
    if (
      isInitialLoad &&
      mostRecentDate &&
      casesData &&
      casesData.cases.length === 0
    ) {
      // Today has no cases, navigate to most recent date with cases
      const mostRecentDateObj = new Date(mostRecentDate);
      setCurrentDate(mostRecentDateObj);
      setIsInitialLoad(false);
    } else if (isInitialLoad && casesData) {
      // Initial load complete (either has cases today or no cases at all)
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, mostRecentDate, casesData]);

  // tRPC Mutations
  const updatePatientMutation = api.cases.updatePatientInfo.useMutation({
    onSuccess: () => {
      toast.success("Patient information updated");
      void refetchCases();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to update patient information");
    },
  });

  const triggerDischargeMutation = api.cases.triggerDischarge.useMutation({
    onSuccess: (result) => {
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach((warning) => toast.warning(warning));
      }
      toast.success("Discharge triggered successfully");
      void refetchCases();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to trigger discharge");
    },
    onSettled: () => {
      // Clear loading state when mutation completes (success or error)
      setLoadingCase(null);
      isProcessingRef.current = false;
    },
  });

  // Batch mutations
  const createBatchMutation = api.cases.createDischargeBatch.useMutation({
    onSuccess: async (result) => {
      setActiveBatchId(result.batchId);
      setShowBatchDialog(false);
      setIsBatchProcessing(true);

      // Call the API to process the batch
      try {
        const response = await fetch("/api/discharge/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            batchId: result.batchId,
            emailScheduleTime: emailScheduleTime.toISOString(),
            callScheduleTime: callScheduleTime.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to process batch");
        }

        const data = await response.json();
        toast.success(
          `Batch processing complete: ${data.successCount} successful, ${data.failedCount} failed`,
        );
      } catch {
        toast.error("Failed to process batch");
      } finally {
        setIsBatchProcessing(false);
        void refetchCases();
      }
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create batch");
      setIsBatchProcessing(false);
    },
  });

  // Store schedule times
  let emailScheduleTime: Date;
  let callScheduleTime: Date;

  // Transform backend data to UI shape
  const cases: DashboardCase[] = useMemo(() => {
    return casesData?.cases
      ? transformBackendCasesToDashboardCases(
          casesData.cases,
          casesData.userEmail,
          casesData.testModeSettings?.enabled ?? false,
          casesData.testModeSettings?.testContactEmail,
          casesData.testModeSettings?.testContactPhone,
        )
      : [];
  }, [casesData?.cases, casesData?.userEmail, casesData?.testModeSettings]);

  const settings: DischargeSettings = settingsData ?? {
    clinicName: "",
    clinicPhone: "",
    clinicEmail: "",
    emergencyPhone: "",
    vetName: "",
    testModeEnabled: false,
    testContactName: "",
    testContactEmail: "",
    testContactPhone: "",
    voicemailDetectionEnabled: false,
  };

  // Handlers
  const handleTriggerCall = async (caseId: string, patientId: string) => {
    // Prevent double-clicks and concurrent mutations
    if (isProcessingRef.current ?? loadingCase !== null) {
      console.log("[Dashboard] Ignoring duplicate call trigger", {
        caseId,
        isProcessing: isProcessingRef.current,
        loadingCase,
      });
      return;
    }

    const caseData = cases.find((c) => c.id === caseId);
    if (!caseData) return;

    // Keep the actual owner name, but override phone/email for test mode
    const ownerName = normalizePlaceholder(caseData.patient.owner_name);
    const ownerEmail = normalizePlaceholder(caseData.patient.owner_email);
    const phone = settings.testModeEnabled
      ? settings.testContactPhone
      : normalizePlaceholder(caseData.patient.owner_phone);

    if (!hasValidContact(phone)) {
      toast.error(
        settings.testModeEnabled
          ? "Test phone number is required. Please configure test contact information in settings."
          : "Phone number is required to send a discharge call. Please enter the owner's phone number first.",
      );
      return;
    }

    // Set loading state BEFORE mutation to prevent race conditions
    isProcessingRef.current = true;
    setLoadingCase({ caseId, type: "call" });

    toast.info("Initiating discharge call...");
    triggerDischargeMutation.mutate({
      caseId,
      patientId,
      patientData: {
        ownerName,
        ownerEmail,
        ownerPhone: phone,
      },
      dischargeType: "call",
    });
  };

  const handleTriggerEmail = async (caseId: string, patientId: string) => {
    // Prevent double-clicks and concurrent mutations
    if (isProcessingRef.current ?? loadingCase !== null) {
      console.log("[Dashboard] Ignoring duplicate email trigger", {
        caseId,
        isProcessing: isProcessingRef.current,
        loadingCase,
      });
      return;
    }

    const caseData = cases.find((c) => c.id === caseId);
    if (!caseData) return;

    // Keep the actual owner name, but override phone/email for test mode
    const ownerName = normalizePlaceholder(caseData.patient.owner_name);
    const ownerPhone = normalizePlaceholder(caseData.patient.owner_phone);
    const email = settings.testModeEnabled
      ? settings.testContactEmail
      : normalizePlaceholder(caseData.patient.owner_email);

    if (!hasValidContact(email)) {
      toast.error(
        settings.testModeEnabled
          ? "Test email address is required. Please configure test contact information in settings."
          : "Email address is required to send a discharge email. Please enter the owner's email address first.",
      );
      return;
    }

    // Set loading state BEFORE mutation to prevent race conditions
    isProcessingRef.current = true;
    setLoadingCase({ caseId, type: "email" });

    toast.info("Sending discharge email...");
    triggerDischargeMutation.mutate({
      caseId,
      patientId,
      patientData: {
        ownerName,
        ownerEmail: email,
        ownerPhone,
      },
      dischargeType: "email",
    });
  };

  const handleUpdatePatient = (patientId: string, data: PatientUpdateInput) => {
    updatePatientMutation.mutate({
      patientId,
      name: data.name,
      species: data.species,
      breed: data.breed,
      ownerName: data.owner_name,
      ownerEmail: data.owner_email,
      ownerPhone: data.owner_phone,
    });
  };

  const handleRefresh = () => {
    void refetchCases();
    void refetchSettings();
    toast.success("Dashboard refreshed");
  };

  const handleBatchDischarge = (emailTimeString: string) => {
    // Parse hour and minute from the time string
    const [hours, minutes] = emailTimeString.split(":").map(Number);

    // Email: Next day at specified time
    emailScheduleTime = addDays(new Date(), 1);
    emailScheduleTime = setHours(emailScheduleTime, hours ?? 9);
    emailScheduleTime = setMinutes(emailScheduleTime, minutes ?? 0);
    emailScheduleTime = setSeconds(emailScheduleTime, 0);

    // Call: 2 days from now at 2 PM
    callScheduleTime = addDays(new Date(), 2);
    callScheduleTime = setHours(callScheduleTime, 14);
    callScheduleTime = setMinutes(callScheduleTime, 0);
    callScheduleTime = setSeconds(callScheduleTime, 0);

    // Create batch with eligible case IDs
    if (eligibleCases && eligibleCases.length > 0) {
      const caseIds = eligibleCases.map((c) => c.id);
      createBatchMutation.mutate({
        caseIds,
        emailScheduleTime: emailScheduleTime.toISOString(),
        callScheduleTime: callScheduleTime.toISOString(),
      });
    }
  };

  const handleBatchComplete = () => {
    setActiveBatchId(null);
    setIsBatchProcessing(false);
    void refetchCases();
  };

  const handleBatchCancel = () => {
    setActiveBatchId(null);
    setIsBatchProcessing(false);
    toast.warning("Batch processing cancelled");
  };

  // Memoized date change handler to prevent unnecessary re-renders
  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
    setCurrentPage(1); // Reset to first page when changing date
  }, []);

  // Filtering (client-side for search and status, server-side for pagination and readiness)
  // Note: Readiness filtering happens on the backend based on user-specific requirements.
  // Cases returned from the backend already meet readiness requirements when readinessFilter is applied.
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          c.patient.name.toLowerCase().includes(searchLower) ||
          c.patient.owner_name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter === "all") return true;

      if (statusFilter === "ready") {
        const hasValidPhone = hasValidContact(c.patient.owner_phone);
        const hasValidEmail = hasValidContact(c.patient.owner_email);
        const hasNoDischarge =
          c.scheduled_discharge_calls.length === 0 &&
          c.scheduled_discharge_emails.length === 0;
        // Enhanced: Ready status filter now works with readiness filter.
        // When "ready" status is selected, cases must have valid contact and no discharge attempts.
        // Discharge readiness requirements (SOAP notes, discharge summary, transcription, etc.)
        // are checked on the backend via the readinessFilter parameter.
        // To show only cases ready for discharge, select both "Ready" status and "Ready for Discharge" readiness filter.
        return (hasValidPhone ?? hasValidEmail) && hasNoDischarge;
      }

      if (statusFilter === "pending") {
        return (
          c.scheduled_discharge_calls.some((call) =>
            ["queued", "ringing", "in_progress"].includes(call.status ?? ""),
          ) ||
          c.scheduled_discharge_emails.some(
            (email) => email.status === "queued",
          )
        );
      }

      if (statusFilter === "completed") {
        const hasCompletedCall = c.scheduled_discharge_calls.some(
          (call) => call.status === "completed",
        );
        const hasSentEmail = c.scheduled_discharge_emails.some(
          (email) => email.status === "sent",
        );
        return c.status === "completed" && hasCompletedCall && hasSentEmail;
      }

      if (statusFilter === "failed") {
        const hasFailedCall = c.scheduled_discharge_calls.some(
          (call) => call.status === "failed",
        );
        const hasFailedEmail = c.scheduled_discharge_emails.some(
          (email) => email.status === "failed",
        );
        return hasFailedCall ?? hasFailedEmail;
      }

      return true;
    });
  }, [cases, searchTerm, statusFilter]);

  // Pagination from backend
  const paginatedCases = filteredCases; // Already paginated by backend

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="animate-card-in flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Discharge Management
            </h1>
            {settings.testModeEnabled && (
              <Badge
                variant="outline"
                className="animate-pulse-glow gap-1 border-amber-500/50 bg-amber-50 text-amber-700"
              >
                <TestTube className="h-3 w-3" />
                Test Mode Active
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Manage automated follow-ups and discharge summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="transition-smooth"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBatchDialog(true)}
            disabled={isLoading ?? isBatchProcessing}
            className="transition-smooth"
          >
            <Send className="mr-2 h-4 w-4" />
            Send All Discharge
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/settings")}
            className="transition-smooth"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </div>
      </div>

      {/* Unified Filter Bar - Search, date controls, date presets, and status filters */}
      <UnifiedFilterBar
        currentDate={currentDate}
        onDateChange={handleDateChange}
        totalItems={casesData?.pagination.total ?? 0}
        isLoading={isLoading}
        statusFilter={statusFilter}
        onStatusFilterChange={(filter) => {
          setStatusFilter(filter);
          setCurrentPage(1); // Reset to first page when changing filter
        }}
        readinessFilter={readinessFilter}
        onReadinessFilterChange={(filter) => {
          setReadinessFilter(filter);
          setCurrentPage(1); // Reset to first page when changing filter
        }}
        searchTerm={searchTerm}
        onSearchChange={(term) => {
          setSearchTerm(term);
          setCurrentPage(1); // Reset to first page on search
        }}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted/10 h-24 animate-pulse rounded-lg border"
            />
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="animate-card-in-delay-2">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedCases.map((c, index) => {
            // Only show loading for the specific case being processed
            const isThisCaseLoading = loadingCase?.caseId === c.id;
            const isLoadingCall =
              isThisCaseLoading &&
              (loadingCase?.type === "call" ?? loadingCase?.type === "both");
            const isLoadingEmail =
              isThisCaseLoading &&
              (loadingCase?.type === "email" ?? loadingCase?.type === "both");

            return (
              <div
                key={c.id}
                className="animate-card-in"
                style={{ animationDelay: `${0.1 + index * 0.02}s` }}
              >
                <DischargeListItem
                  caseData={c}
                  settings={settings}
                  onTriggerCall={(id) => handleTriggerCall(id, c.patient.id)}
                  onTriggerEmail={(id) => handleTriggerEmail(id, c.patient.id)}
                  onUpdatePatient={handleUpdatePatient}
                  testModeEnabled={settings.testModeEnabled}
                  testContactName={settings.testContactName}
                  testContactEmail={settings.testContactEmail}
                  testContactPhone={settings.testContactPhone}
                  isLoadingCall={isLoadingCall}
                  isLoadingEmail={isLoadingEmail}
                  isLoadingUpdate={updatePatientMutation.isPending}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Batch Discharge Dialog */}
      <BatchDischargeDialog
        open={showBatchDialog}
        onOpenChange={setShowBatchDialog}
        eligibleCases={
          eligibleCases?.map((c) => ({
            id: c.id,
            patientName: c.patientName,
            ownerName: c.ownerName,
            ownerEmail: c.ownerEmail,
            ownerPhone: c.ownerPhone,
            hasEmail: !!c.ownerEmail,
            hasPhone: !!c.ownerPhone,
          })) ?? []
        }
        onConfirm={handleBatchDischarge}
        isProcessing={isBatchProcessing}
      />

      {/* Batch Progress Monitor */}
      {activeBatchId && (
        <BatchProgressMonitor
          batchId={activeBatchId}
          onComplete={handleBatchComplete}
          onCancel={handleBatchCancel}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Settings, Search, RefreshCw, TestTube } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { CaseCard } from "./case-card";
import { EmptyState } from "./empty-state";
import { DayPaginationControls } from "./day-pagination-controls";
import { DateFilterButtonGroup } from "./date-filter-button-group";
import { StatusSummaryBar } from "./status-summary-bar";
import { api } from "~/trpc/client";
import type {
  DashboardCase,
  DischargeSettings,
  PatientUpdateInput,
} from "~/types/dashboard";
import { transformBackendCasesToDashboardCases } from "~/lib/transforms/case-transforms";
import { toast } from "sonner";
import { format } from "date-fns";

const PAGE_SIZE = 10;

/** Tracks which case is currently being processed and what type of discharge */
interface LoadingState {
  caseId: string;
  type: "call" | "email" | "both";
}

/**
 * Check if a value is a placeholder (missing data indicator) and convert to undefined
 */
function normalizePlaceholder(
  value: string | undefined | null,
): string | undefined {
  if (!value) return undefined;
  const placeholders = [
    "Unknown Patient",
    "Unknown Species",
    "Unknown Breed",
    "Unknown Owner",
    "No email address",
    "No phone number",
  ];
  return placeholders.includes(value) ? undefined : value;
}

/**
 * DischargesTab - Manage discharge calls and emails for cases
 *
 * Note: The `startDate` and `endDate` props are kept for backward compatibility
 * but are ignored. Date filtering is now handled via URL query parameter "dateRange"
 * using the DateFilterButtonGroup component.
 *
 * When a date range is selected (not "all"), the start date of that range is used
 * for the day navigation. When "all" is selected, day navigation works normally.
 */
export function DischargesTab({
  startDate: _startDate,
  endDate: _endDate,
}: {
  /** @deprecated Use dateRange URL query parameter instead */
  startDate?: string | null;
  /** @deprecated Use dateRange URL query parameter instead */
  endDate?: string | null;
}) {
  const router = useRouter();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingCase, setLoadingCase] = useState<LoadingState | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ready" | "pending" | "completed" | "failed"
  >("all");

  // Ref to prevent double-clicks
  const isProcessingRef = useRef(false);

  // Format date for API (YYYY-MM-DD)
  const dateString = useMemo(() => {
    return format(currentDate, "yyyy-MM-dd");
  }, [currentDate]);

  // tRPC Queries
  const {
    data: casesData,
    isLoading,
    refetch: refetchCases,
  } = api.cases.listMyCasesToday.useQuery({
    page: currentPage,
    pageSize: PAGE_SIZE,
    date: dateString,
  });

  const { data: settingsData, refetch: refetchSettings } =
    api.cases.getDischargeSettings.useQuery();

  // tRPC Mutations
  const updatePatientMutation = api.cases.updatePatientInfo.useMutation({
    onSuccess: () => {
      toast.success("Patient information updated");
      void refetchCases();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update patient information");
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
      toast.error(error.message || "Failed to trigger discharge");
    },
    onSettled: () => {
      // Clear loading state when mutation completes (success or error)
      setLoadingCase(null);
      isProcessingRef.current = false;
    },
  });

  // Transform backend data to UI shape
  const cases: DashboardCase[] = useMemo(() => {
    return casesData?.cases
      ? transformBackendCasesToDashboardCases(casesData.cases)
      : [];
  }, [casesData?.cases]);

  // Keep reference to backend cases for debug modal
  const backendCases = casesData?.cases ?? [];

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

  // Helper to check if a value is a valid (non-placeholder) contact
  function hasValidContact(value: string | undefined | null): value is string {
    const normalized = normalizePlaceholder(value);
    return normalized !== undefined && normalized.trim().length > 0;
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const ready = cases.filter((c) => {
      const hasValidPhone = hasValidContact(c.patient.owner_phone);
      const hasValidEmail = hasValidContact(c.patient.owner_email);
      const hasNoDischarge =
        c.scheduled_discharge_calls.length === 0 &&
        c.scheduled_discharge_emails.length === 0;
      return (hasValidPhone || hasValidEmail) && hasNoDischarge;
    }).length;

    const pending = cases.filter((c) => {
      return (
        c.scheduled_discharge_calls.some((call) =>
          ["queued", "ringing", "in_progress"].includes(call.status ?? ""),
        ) ||
        c.scheduled_discharge_emails.some((email) => email.status === "queued")
      );
    }).length;

    const completed = cases.filter((c) => {
      const hasCompletedCall = c.scheduled_discharge_calls.some(
        (call) => call.status === "completed",
      );
      const hasSentEmail = c.scheduled_discharge_emails.some(
        (email) => email.status === "sent",
      );
      return c.status === "completed" || hasCompletedCall || hasSentEmail;
    }).length;

    const failed = cases.filter((c) => {
      const hasFailedCall = c.scheduled_discharge_calls.some(
        (call) => call.status === "failed",
      );
      const hasFailedEmail = c.scheduled_discharge_emails.some(
        (email) => email.status === "failed",
      );
      return hasFailedCall || hasFailedEmail;
    }).length;

    const scheduledCalls = cases.reduce(
      (acc, c) => acc + c.scheduled_discharge_calls.length,
      0,
    );

    const scheduledEmails = cases.reduce(
      (acc, c) => acc + c.scheduled_discharge_emails.length,
      0,
    );

    return {
      total: cases.length,
      ready,
      pending,
      completed,
      failed,
      scheduledCalls,
      scheduledEmails,
    };
  }, [cases]);

  // Handlers
  const handleTriggerCall = async (caseId: string, patientId: string) => {
    // Prevent double-clicks and concurrent mutations
    if (isProcessingRef.current || loadingCase !== null) {
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
    if (isProcessingRef.current || loadingCase !== null) {
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

  // Filtering (client-side for search and status, server-side for pagination)
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
        return (hasValidPhone || hasValidEmail) && hasNoDischarge;
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
        return c.status === "completed" || hasCompletedCall || hasSentEmail;
      }

      if (statusFilter === "failed") {
        const hasFailedCall = c.scheduled_discharge_calls.some(
          (call) => call.status === "failed",
        );
        const hasFailedEmail = c.scheduled_discharge_emails.some(
          (email) => email.status === "failed",
        );
        return hasFailedCall || hasFailedEmail;
      }

      return true;
    });
  }, [cases, searchTerm, statusFilter]);

  // Pagination from backend
  const paginatedCases = filteredCases; // Already paginated by backend

  return (
    <div className="animate-tab-content space-y-6">
      {/* Header */}
      <div className="animate-card-in flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              Discharge Management
            </h2>
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
          <p className="text-sm text-slate-600">
            Manage automated follow-up calls and emails for today&apos;s cases.
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
            onClick={() => router.push("/dashboard/settings")}
            className="transition-smooth"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="animate-card-in-delay-1 flex items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search patients or owners..."
            className="transition-smooth pl-9 focus:ring-2"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>

      {/* Day Pagination and Date Filter */}
      <div className="animate-card-in-delay-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!isLoading && casesData && (
          <DayPaginationControls
            currentDate={currentDate}
            onDateChange={(date) => {
              setCurrentDate(date);
              setCurrentPage(1); // Reset to first page when changing date
            }}
            totalItems={casesData.pagination.total}
          />
        )}
        <DateFilterButtonGroup />
      </div>

      {/* Status Summary Bar */}
      {!isLoading && (
        <StatusSummaryBar
          totalCases={stats.total}
          readyCases={stats.ready}
          pendingCases={stats.pending}
          completedCases={stats.completed}
          failedCases={stats.failed}
          scheduledCalls={stats.scheduledCalls}
          scheduledEmails={stats.scheduledEmails}
          onFilterChange={(filter) => {
            setStatusFilter(filter);
            setCurrentPage(1); // Reset to first page when changing filter
          }}
          activeFilter={statusFilter}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-muted/10 h-[300px] animate-pulse rounded-xl border"
            />
          ))}
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="animate-card-in-delay-2">
          <EmptyState />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCases.map((c, index) => {
            const backendCase = backendCases.find((bc) => bc.id === c.id);
            // Only show loading for the specific case being processed
            const isThisCaseLoading = loadingCase?.caseId === c.id;
            const isLoadingCall =
              isThisCaseLoading &&
              (loadingCase?.type === "call" || loadingCase?.type === "both");
            const isLoadingEmail =
              isThisCaseLoading &&
              (loadingCase?.type === "email" || loadingCase?.type === "both");

            return (
              <div
                key={c.id}
                className="animate-card-in"
                style={{ animationDelay: `${0.2 + index * 0.05}s` }}
              >
                <CaseCard
                  caseData={c}
                  backendCaseData={backendCase}
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
    </div>
  );
}

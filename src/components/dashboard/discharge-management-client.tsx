"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Button } from "~/components/ui/button";
import {
  RefreshCw,
  TestTube,
  Send,
  Phone,
  ClipboardList,
  Mail,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { DischargeListItem } from "./discharge-list-item";
import { EmptyState } from "./empty-state";
import { type CallEndReasonFilter } from "./consolidated-filter-bar";
import { BatchDischargeDialog } from "./batch-discharge-dialog";
import { BatchProgressMonitor } from "./batch-progress-monitor";
import { VapiCallHistory } from "./vapi-call-history";
import { EmailHistory } from "./email-history";
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
import {
  format,
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  parseISO,
  startOfDay,
} from "date-fns";
import type { DischargeReadinessFilter } from "~/types/dashboard";

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
 * - Day-by-day date navigation with URL persistence (refresh returns to same day)
 * - Status filtering (All, Ready, Pending, Completed, Failed)
 * - Search by patient or owner name
 * - Discharge call/email triggering
 * - Inline patient information editing
 * - Test mode support for safe testing
 * - Real-time status updates
 * - All cases for selected day displayed at once (no pagination)
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

  // Date state - persisted in URL query parameter for refresh persistence
  const [dateStr, setDateStr] = useQueryState("date", {
    defaultValue: format(startOfDay(new Date()), "yyyy-MM-dd"),
  });

  // Parse date from query string
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

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingCases, setLoadingCases] = useState<Map<string, LoadingState>>(
    new Map(),
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ready" | "pending" | "completed" | "failed"
  >("all");
  const [readinessFilter, setReadinessFilter] =
    useState<DischargeReadinessFilter>("all");
  const [callEndReasonFilter, setCallEndReasonFilter] =
    useState<CallEndReasonFilter>("all");
  const [activeTab, setActiveTab] = useState<"cases" | "calls" | "emails">(
    "cases",
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Batch discharge state
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Calculate date parameters - use single date (day navigation)
  // When search term is active, override date filters to search all time
  const dateParams = useMemo(() => {
    // If searching, ignore date filters and search all time
    if (searchTerm.trim()) {
      return { fetchAll: true }; // No date filters = search all time, but still fetch all
    }
    // Use single date parameter (day navigation) and fetch all cases for that day
    return { date: format(currentDate, "yyyy-MM-dd"), fetchAll: true };
  }, [currentDate, searchTerm]);

  // tRPC Queries - fetch all cases for the selected day (no pagination)
  const {
    data: casesData,
    isLoading,
    refetch: refetchCases,
    isFetching,
  } = api.cases.listMyCasesToday.useQuery({
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
      void setDateStr(mostRecentDate);
      setIsInitialLoad(false);
    } else if (isInitialLoad && casesData) {
      // Initial load complete (either has cases today or no cases at all)
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, mostRecentDate, casesData, setDateStr]);

  // Transform backend data to UI shape - all cases are now fetched at once
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

  // Total cases count
  const totalCases = casesData?.pagination?.total ?? 0;

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
  });

  // Store schedule times
  let emailScheduleTime: Date;
  let callScheduleTime: Date;

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

  // Handlers
  const handleTriggerCall = async (caseId: string, patientId: string) => {
    // Prevent duplicate triggers for the same case
    if (loadingCases.has(caseId)) {
      console.log("[Dashboard] Ignoring duplicate call trigger", {
        caseId,
        loadingState: loadingCases.get(caseId),
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
    setLoadingCases((prev) =>
      new Map(prev).set(caseId, { caseId, type: "call" }),
    );

    toast.info("Initiating discharge call...");
    triggerDischargeMutation.mutate(
      {
        caseId,
        patientId,
        patientData: {
          ownerName,
          ownerEmail,
          ownerPhone: phone,
        },
        dischargeType: "call",
      },
      {
        onSettled: () => {
          // Clear loading state for this specific case when mutation completes
          setLoadingCases((prev) => {
            const next = new Map(prev);
            next.delete(caseId);
            return next;
          });
        },
      },
    );
  };

  const handleTriggerEmail = async (caseId: string, patientId: string) => {
    // Prevent duplicate triggers for the same case
    if (loadingCases.has(caseId)) {
      console.log("[Dashboard] Ignoring duplicate email trigger", {
        caseId,
        loadingState: loadingCases.get(caseId),
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
    setLoadingCases((prev) =>
      new Map(prev).set(caseId, { caseId, type: "email" }),
    );

    toast.info("Sending discharge email...");
    triggerDischargeMutation.mutate(
      {
        caseId,
        patientId,
        patientData: {
          ownerName,
          ownerEmail: email,
          ownerPhone,
        },
        dischargeType: "email",
      },
      {
        onSettled: () => {
          // Clear loading state for this specific case when mutation completes
          setLoadingCases((prev) => {
            const next = new Map(prev);
            next.delete(caseId);
            return next;
          });
        },
      },
    );
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

    // Email: Next day at specified time (Day 1)
    emailScheduleTime = addDays(new Date(), 1);
    emailScheduleTime = setHours(emailScheduleTime, hours ?? 9);
    emailScheduleTime = setMinutes(emailScheduleTime, minutes ?? 0);
    emailScheduleTime = setSeconds(emailScheduleTime, 0);

    // Call: 2 days after the email (Day 3) = 3 days from now at 2 PM
    callScheduleTime = addDays(new Date(), 3);
    callScheduleTime = setHours(callScheduleTime, 14);
    callScheduleTime = setMinutes(callScheduleTime, 0);
    callScheduleTime = setSeconds(callScheduleTime, 0);

    console.log("[BatchDischarge] Schedule times calculated", {
      emailScheduleTime: emailScheduleTime.toISOString(),
      callScheduleTime: callScheduleTime.toISOString(),
    });

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
  const handleDateChange = useCallback(
    (date: Date) => {
      void setDateStr(format(startOfDay(date), "yyyy-MM-dd"));
    },
    [setDateStr],
  );

  // Helper function to check if a call matches the end reason filter
  const matchesCallEndReasonFilter = useCallback(
    (endedReason: string | null | undefined): boolean => {
      if (callEndReasonFilter === "all") return true;
      if (!endedReason) return false;

      const reason = endedReason.toLowerCase();

      switch (callEndReasonFilter) {
        case "successful":
          return [
            "assistant-ended-call",
            "customer-ended-call",
            "assistant-forwarded-call",
          ].includes(reason);
        case "voicemail":
          return reason === "voicemail";
        case "no_answer":
          return [
            "customer-did-not-answer",
            "dial-no-answer",
            "silence-timed-out",
          ].includes(reason);
        case "busy":
          return ["customer-busy", "dial-busy"].includes(reason);
        case "failed":
          return [
            "dial-failed",
            "assistant-error",
            "exceeded-max-duration",
          ].some((r) => reason.includes(r));
        default:
          return true;
      }
    },
    [callEndReasonFilter],
  );

  // Filtering (client-side for search and status, server-side for readiness)
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

      // Call end reason filter - check if any call matches the filter
      if (callEndReasonFilter !== "all") {
        const hasMatchingCall = c.scheduled_discharge_calls.some((call) =>
          matchesCallEndReasonFilter(call.ended_reason),
        );
        if (!hasMatchingCall) return false;
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
  }, [cases, searchTerm, statusFilter, callEndReasonFilter, matchesCallEndReasonFilter]);

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header - Top Right Navigation Only */}
      <div className="animate-card-in flex items-center justify-end">
        {/* Top Right Navigation */}
        <div className="flex flex-col items-end gap-2">
          {/* Tabs for Cases and Call History */}
          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(v as "cases" | "calls" | "emails")
            }
          >
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="cases" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Cases
              </TabsTrigger>
              <TabsTrigger value="calls" className="gap-2">
                <Phone className="h-4 w-4" />
                Call History
              </TabsTrigger>
              <TabsTrigger value="emails" className="gap-2">
                <Mail className="h-4 w-4" />
                Email History
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Send All Discharge Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/cases/batch-discharge")}
            disabled={isLoading}
            className="transition-smooth"
          >
            <Send className="mr-2 h-4 w-4" />
            Send All Discharge
          </Button>
        </div>
      </div>

      {/* Content based on active tab */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "cases" | "calls" | "emails")}
        className="space-y-4"
      >
        {/* Cases Tab */}
        <TabsContent value="cases" className="space-y-4">
          {/* Test Mode Badge - Centered */}
          {settings.testModeEnabled && (
            <div className="mb-4 flex justify-center">
              <Badge
                variant="outline"
                className="animate-pulse-glow gap-1 border-amber-500/50 bg-amber-50 text-amber-700"
              >
                <TestTube className="h-3 w-3" />
                Test Mode Active
              </Badge>
            </div>
          )}

          {/* Search Bar with Refresh Button */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="relative max-w-md flex-1">
              <input
                type="search"
                placeholder="Search patients or owners..."
                className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-10 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="transition-smooth shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          {/* Date Navigation - Under Search Bar */}
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(addDays(currentDate, -1))}
              className="transition-smooth"
            >
              ←
            </Button>

            <div className="text-center">
              <h2 className="text-lg font-medium text-slate-900">
                {format(currentDate, "EEEE, MMMM d, yyyy")}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {totalCases} case{totalCases !== 1 ? "s" : ""}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateChange(addDays(currentDate, 1))}
              className="transition-smooth"
            >
              →
            </Button>
          </div>

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
              {filteredCases.map((c, index) => {
                // Check loading state for this specific case from the map
                const caseLoadingState = loadingCases.get(c.id);
                const isThisCaseLoading = caseLoadingState !== undefined;
                const isLoadingCall =
                  isThisCaseLoading &&
                  (caseLoadingState?.type === "call" ||
                    caseLoadingState?.type === "both");
                const isLoadingEmail =
                  isThisCaseLoading &&
                  (caseLoadingState?.type === "email" ||
                    caseLoadingState?.type === "both");

                return (
                  <div
                    key={c.id}
                    className="animate-card-in"
                    style={{ animationDelay: `${0.1 + index * 0.02}s` }}
                  >
                    <DischargeListItem
                      caseData={c}
                      settings={settings}
                      onTriggerCall={(id) =>
                        handleTriggerCall(id, c.patient.id)
                      }
                      onTriggerEmail={(id) =>
                        handleTriggerEmail(id, c.patient.id)
                      }
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

              {/* Show total count */}
              {filteredCases.length > 0 && (
                <div className="text-muted-foreground pt-4 text-center text-sm">
                  Showing {filteredCases.length} case
                  {filteredCases.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Call History Tab */}
        <TabsContent value="calls">
          <VapiCallHistory />
        </TabsContent>

        {/* Email History Tab */}
        <TabsContent value="emails">
          <EmailHistory />
        </TabsContent>
      </Tabs>

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

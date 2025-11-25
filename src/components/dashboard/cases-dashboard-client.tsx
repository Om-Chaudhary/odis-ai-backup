"use client";

import { useState, useMemo, useRef } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Settings, Search, Plus, RefreshCw, TestTube } from "lucide-react";
import { CaseCard } from "./case-card";
import { EmptyState } from "./empty-state";
import { DayPaginationControls } from "./day-pagination-controls";
import { DischargeSettingsPanel } from "./discharge-settings-panel";
import { TestModeBanner } from "./test-mode-banner";
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

export function CasesDashboardClient() {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [loadingCase, setLoadingCase] = useState<LoadingState | null>(null);

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

  const updateSettingsMutation = api.cases.updateDischargeSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      setIsSettingsOpen(false);
      void refetchSettings();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save settings");
    },
  });

  // Transform backend data to UI shape
  const cases: DashboardCase[] = casesData?.cases
    ? transformBackendCasesToDashboardCases(casesData.cases)
    : [];

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
  };

  // Helper to check if a value is a valid (non-placeholder) contact
  function hasValidContact(value: string | undefined | null): value is string {
    const normalized = normalizePlaceholder(value);
    return normalized !== undefined && normalized.trim().length > 0;
  }

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

    // Use test contact info if test mode is enabled, otherwise use patient contact info
    const phone = settings.testModeEnabled
      ? settings.testContactPhone
      : normalizePlaceholder(caseData.patient.owner_phone);
    const ownerName = settings.testModeEnabled
      ? settings.testContactName
      : normalizePlaceholder(caseData.patient.owner_name);
    const ownerEmail = settings.testModeEnabled
      ? settings.testContactEmail
      : normalizePlaceholder(caseData.patient.owner_email);

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

    // Use test contact info if test mode is enabled, otherwise use patient contact info
    const email = settings.testModeEnabled
      ? settings.testContactEmail
      : normalizePlaceholder(caseData.patient.owner_email);
    const ownerName = settings.testModeEnabled
      ? settings.testContactName
      : normalizePlaceholder(caseData.patient.owner_name);
    const ownerPhone = settings.testModeEnabled
      ? settings.testContactPhone
      : normalizePlaceholder(caseData.patient.owner_phone);

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

  const handleTriggerBoth = async (caseId: string, patientId: string) => {
    // Prevent double-clicks and concurrent mutations
    if (isProcessingRef.current || loadingCase !== null) {
      console.log("[Dashboard] Ignoring duplicate both trigger", {
        caseId,
        isProcessing: isProcessingRef.current,
        loadingCase,
      });
      return;
    }

    const caseData = cases.find((c) => c.id === caseId);
    if (!caseData) return;

    // Use test contact info if test mode is enabled, otherwise use patient contact info
    const phone = settings.testModeEnabled
      ? settings.testContactPhone
      : normalizePlaceholder(caseData.patient.owner_phone);
    const email = settings.testModeEnabled
      ? settings.testContactEmail
      : normalizePlaceholder(caseData.patient.owner_email);
    const ownerName = settings.testModeEnabled
      ? settings.testContactName
      : normalizePlaceholder(caseData.patient.owner_name);

    const hasPhone = hasValidContact(phone);
    const hasEmail = hasValidContact(email);

    if (!hasPhone && !hasEmail) {
      toast.error(
        settings.testModeEnabled
          ? "At least one test contact method is required. Please configure test contact information in settings."
          : "At least one contact method is required. Please enter the owner's phone number or email address first.",
      );
      return;
    }

    if (!hasPhone) {
      toast.warning(
        settings.testModeEnabled
          ? "Test phone number is missing. Only email will be sent."
          : "Phone number is missing. Only email will be sent. Please enter the owner's phone number to also send a call.",
      );
    } else if (!hasEmail) {
      toast.warning(
        settings.testModeEnabled
          ? "Test email address is missing. Only call will be made."
          : "Email address is missing. Only call will be made. Please enter the owner's email address to also send an email.",
      );
    }

    // Set loading state BEFORE mutation to prevent race conditions
    isProcessingRef.current = true;
    setLoadingCase({ caseId, type: "both" });

    toast.info("Initiating discharge call and email...");
    triggerDischargeMutation.mutate({
      caseId,
      patientId,
      patientData: {
        ownerName,
        ownerEmail: email,
        ownerPhone: phone,
      },
      dischargeType: "both",
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

  const handleSaveSettings = (newSettings: DischargeSettings) => {
    // Only send non-empty values to avoid validation errors
    updateSettingsMutation.mutate({
      clinicName: newSettings.clinicName || undefined,
      clinicPhone: newSettings.clinicPhone || undefined,
      clinicEmail: newSettings.clinicEmail || undefined,
      emergencyPhone: newSettings.emergencyPhone || undefined,
      testModeEnabled: newSettings.testModeEnabled,
      testContactName: newSettings.testContactName ?? undefined,
      testContactEmail: newSettings.testContactEmail ?? undefined,
      testContactPhone: newSettings.testContactPhone ?? undefined,
    });
  };

  const handleRefresh = () => {
    void refetchCases();
    void refetchSettings();
    toast.success("Dashboard refreshed");
  };

  // Filtering (client-side for search, server-side for pagination)
  const filteredCases = cases.filter((c) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      c.patient.name.toLowerCase().includes(searchLower) ||
      c.patient.owner_name.toLowerCase().includes(searchLower)
    );
  });

  // Pagination from backend
  const paginatedCases = filteredCases; // Already paginated by backend

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Test Mode Banner */}
      <TestModeBanner
        settings={settings}
        onUpdate={handleSaveSettings}
        isLoading={updateSettingsMutation.isPending}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Discharge Dashboard
          </h1>
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
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          {!settings.testModeEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleSaveSettings({
                  ...settings,
                  testModeEnabled: true,
                })
              }
              className="border-amber-600/30 text-amber-700 hover:bg-amber-50 hover:text-amber-900"
            >
              <TestTube className="mr-2 h-4 w-4" />
              Enable Test Mode
            </Button>
          )}
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search patients or owners..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>

      {/* Day Pagination - Moved to top */}
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
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedCases.map((c) => {
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
              <CaseCard
                key={c.id}
                caseData={c}
                backendCaseData={backendCase}
                settings={settings}
                onTriggerCall={(id) => handleTriggerCall(id, c.patient.id)}
                onTriggerEmail={(id) => handleTriggerEmail(id, c.patient.id)}
                onTriggerBoth={(id) => handleTriggerBoth(id, c.patient.id)}
                onUpdatePatient={handleUpdatePatient}
                testModeEnabled={settings.testModeEnabled}
                testContactName={settings.testContactName}
                testContactEmail={settings.testContactEmail}
                testContactPhone={settings.testContactPhone}
                isLoadingCall={isLoadingCall}
                isLoadingEmail={isLoadingEmail}
                isLoadingUpdate={updatePatientMutation.isPending}
              />
            );
          })}
        </div>
      )}

      {/* Settings Panel */}
      <DischargeSettingsPanel
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        isLoading={updateSettingsMutation.isPending}
      />
    </div>
  );
}
